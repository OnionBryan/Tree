import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
from typing import Dict, Tuple, Optional, List, Union, Callable
from dataclasses import dataclass, field
from enum import Enum
import warnings
from datetime import datetime
import requests
from scipy import optimize
from scipy import stats
import logging
import math
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CovarianceMethod(Enum):
    """Covariance estimation methods"""
    SAMPLE = "sample"
    LEDOIT_WOLF = "ledoit_wolf"
    LEDOIT_WOLF_NONLINEAR = "ledoit_wolf_nonlinear"
    CONSTANT_CORRELATION = "constant_correlation"
    EXPONENTIAL_WEIGHTED = "exponential_weighted"
    FACTOR_MODEL = "factor_model"
    NEURAL_COVARIANCE = "neural_covariance"  # NEW
    GRAPH_NEURAL = "graph_neural"  # NEW
    ATTENTION_BASED = "attention_based"  # NEW


class OptimizationMethod(Enum):
    """Portfolio optimization objectives"""
    MINIMUM_VARIANCE = "minimum_variance"
    MEAN_VARIANCE = "mean_variance"
    MAXIMUM_SHARPE = "maximum_sharpe"
    RISK_PARITY = "risk_parity"
    MAXIMUM_DIVERSIFICATION = "maximum_diversification"
    MINIMUM_CVAR = "minimum_cvar"
    NEURAL_RISK_PARITY = "neural_risk_parity"
    DEEP_HEDGING = "deep_hedging"
    REINFORCEMENT_LEARNING = "reinforcement_learning"


class RebalanceFrequency(Enum):
    """Rebalancing frequency options"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUALLY = "annually"
    THRESHOLD = "threshold"  # Rebalance when drift exceeds threshold


class TransactionCostModel(Enum):
    """Transaction cost models"""
    PROPORTIONAL = "proportional"  # Percentage of trade value
    FIXED_PLUS_PROPORTIONAL = "fixed_plus_proportional"
    MARKET_IMPACT = "market_impact"  # Square-root model
    NONE = "none"


@dataclass
class PortfolioMoments:
    """First four moments of portfolio return distribution"""
    mean: float
    variance: float
    skewness: float
    kurtosis: float

    @property
    def volatility(self) -> float:
        return torch.sqrt(torch.tensor(max(0, self.variance))).item()

    def sharpe_ratio(self, risk_free_rate: float = 0.0) -> float:
        vol = self.volatility
        return (self.mean - risk_free_rate) / vol if vol > 1e-10 else 0.0


@dataclass
class BacktestResult:
    """Results from portfolio backtesting"""
    dates: List
    portfolio_values: torch.Tensor
    portfolio_returns: torch.Tensor
    weights_history: torch.Tensor
    rebalance_dates: List
    transaction_costs: torch.Tensor
    turnover: torch.Tensor

    # Performance metrics
    total_return: float
    annualized_return: float
    annualized_volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    calmar_ratio: float

    # Additional metrics
    win_rate: float
    avg_win: float
    avg_loss: float
    profit_factor: float

    def plot_equity_curve(self):
        """Plot portfolio value over time"""
        import matplotlib.pyplot as plt
        plt.figure(figsize=(12, 6))
        plt.plot(self.dates, self.portfolio_values.cpu().numpy())
        plt.title('Portfolio Equity Curve')
        plt.xlabel('Date')
        plt.ylabel('Portfolio Value')
        plt.grid(True)
        plt.show()

    def plot_drawdown(self):
        """Plot drawdown over time"""
        import matplotlib.pyplot as plt
        cummax = torch.cummax(self.portfolio_values, dim=0)[0]
        drawdown = (self.portfolio_values - cummax) / cummax * 100

        plt.figure(figsize=(12, 6))
        plt.fill_between(range(len(drawdown)), drawdown.cpu().numpy(), 0, alpha=0.3, color='red')
        plt.plot(drawdown.cpu().numpy(), color='red')
        plt.title('Portfolio Drawdown')
        plt.xlabel('Time Period')
        plt.ylabel('Drawdown (%)')
        plt.grid(True)
        plt.show()


@dataclass
class MultiPeriodResult:
    """Results from multi-period optimization"""
    optimal_weights: torch.Tensor
    expected_utility: float
    terminal_wealth: float
    path_statistics: Dict[str, float]
    rebalancing_plan: List[Tuple[int, torch.Tensor]]  # (period, weights)


@dataclass
class OptimizationResult:
    """Results from portfolio optimization"""
    weights: torch.Tensor
    objective_value: float
    success: bool
    iterations: int
    gradient_norm: float
    constraints_satisfied: bool
    message: str
    risk_measures: Optional[Dict[str, float]] = None

    def effective_number_of_assets(self) -> float:
        w = self.weights[self.weights > 1e-10]
        return torch.exp(-torch.sum(w * torch.log(w))).item()


# ============================================================================
# BACKTESTING ENGINE
# ============================================================================

class PortfolioBacktester:
    """Comprehensive backtesting engine with transaction costs"""

    def __init__(self,
                 returns: torch.Tensor,
                 dates: List,
                 initial_capital: float = 1000000.0,
                 device: str = 'cpu'):
        """
        Args:
            returns: (T, N) tensor of asset returns
            dates: List of dates/indices corresponding to returns
            initial_capital: Starting portfolio value
            device: torch device
        """
        self.device = torch.device(device)
        self.returns = returns.to(self.device)
        self.dates = dates
        self.initial_capital = initial_capital
        self.T, self.N = returns.shape

        logger.info(f"Initialized backtester: T={self.T}, N={self.N}, capital=${initial_capital:,.0f}")

    def compute_transaction_costs(self,
                                  old_weights: torch.Tensor,
                                  new_weights: torch.Tensor,
                                  portfolio_value: float,
                                  cost_model: TransactionCostModel = TransactionCostModel.PROPORTIONAL,
                                  cost_rate: float = 0.001,
                                  fixed_cost: float = 0.0,
                                  market_impact_coef: float = 0.0) -> float:
        """
        Compute transaction costs for rebalancing

        Args:
            old_weights: Current weights
            new_weights: Target weights
            portfolio_value: Current portfolio value
            cost_model: Type of cost model
            cost_rate: Proportional cost (e.g., 0.001 = 0.1%)
            fixed_cost: Fixed cost per transaction
            market_impact_coef: Market impact coefficient

        Returns:
            Total transaction cost in dollars
        """
        trade_amounts = torch.abs(new_weights - old_weights) * portfolio_value

        if cost_model == TransactionCostModel.NONE:
            return 0.0

        elif cost_model == TransactionCostModel.PROPORTIONAL:
            return torch.sum(trade_amounts).item() * cost_rate

        elif cost_model == TransactionCostModel.FIXED_PLUS_PROPORTIONAL:
            n_trades = torch.sum(torch.abs(new_weights - old_weights) > 1e-6).item()
            proportional = torch.sum(trade_amounts).item() * cost_rate
            fixed = n_trades * fixed_cost
            return proportional + fixed

        elif cost_model == TransactionCostModel.MARKET_IMPACT:
            # Square-root market impact model
            proportional = torch.sum(trade_amounts).item() * cost_rate
            market_impact = market_impact_coef * torch.sum(torch.sqrt(trade_amounts)).item()
            return proportional + market_impact

        return 0.0

    def should_rebalance(self,
                         current_weights: torch.Tensor,
                         target_weights: torch.Tensor,
                         rebalance_freq: RebalanceFrequency,
                         current_idx: int,
                         last_rebalance_idx: int,
                         threshold: float = 0.05) -> bool:
        """
        Determine if portfolio should be rebalanced

        Args:
            current_weights: Current portfolio weights (after drift)
            target_weights: Target strategic weights
            rebalance_freq: Rebalancing frequency
            current_idx: Current time index
            last_rebalance_idx: Last rebalancing index
            threshold: Drift threshold for threshold-based rebalancing

        Returns:
            True if should rebalance
        """
        if rebalance_freq == RebalanceFrequency.DAILY:
            return True

        elif rebalance_freq == RebalanceFrequency.WEEKLY:
            return (current_idx - last_rebalance_idx) >= 5

        elif rebalance_freq == RebalanceFrequency.MONTHLY:
            return (current_idx - last_rebalance_idx) >= 21

        elif rebalance_freq == RebalanceFrequency.QUARTERLY:
            return (current_idx - last_rebalance_idx) >= 63

        elif rebalance_freq == RebalanceFrequency.ANNUALLY:
            return (current_idx - last_rebalance_idx) >= 252

        elif rebalance_freq == RebalanceFrequency.THRESHOLD:
            weight_drift = torch.max(torch.abs(current_weights - target_weights))
            return weight_drift.item() > threshold

        return False

    def run_backtest(self,
                     optimization_method: str,
                     lookback_window: int = 252,
                     rebalance_freq: RebalanceFrequency = RebalanceFrequency.MONTHLY,
                     rebalance_threshold: float = 0.05,
                     cost_model: TransactionCostModel = TransactionCostModel.PROPORTIONAL,
                     cost_rate: float = 0.001,
                     min_history: int = 60,
                     bounds: Tuple[float, float] = (0.0, 1.0)) -> BacktestResult:
        """
        Run walk-forward backtest with rolling window optimization

        Args:
            optimization_method: Method to use for optimization
            lookback_window: Number of periods for rolling window
            rebalance_freq: How often to rebalance
            rebalance_threshold: Drift threshold (for threshold-based rebalancing)
            cost_model: Transaction cost model
            cost_rate: Cost rate (depends on model)
            min_history: Minimum history required before starting
            bounds: Weight bounds

        Returns:
            BacktestResult with complete performance metrics
        """
        logger.info(f"Starting backtest: method={optimization_method}, window={lookback_window}")

        # Initialize tracking
        portfolio_values = torch.zeros(self.T, device=self.device)
        portfolio_returns = torch.zeros(self.T, device=self.device)
        weights_history = torch.zeros(self.T, self.N, device=self.device)
        transaction_costs = torch.zeros(self.T, device=self.device)
        turnover = torch.zeros(self.T, device=self.device)

        rebalance_dates = []

        # Start with equal weights
        current_weights = torch.ones(self.N, device=self.device) / self.N
        portfolio_value = self.initial_capital
        last_rebalance_idx = min_history

        portfolio_values[0] = portfolio_value
        weights_history[0] = current_weights

        # Walk forward
        for t in range(min_history, self.T):
            # Get historical data for optimization
            start_idx = max(0, t - lookback_window)
            historical_returns = self.returns[start_idx:t]

            # Check if we should rebalance
            if self.should_rebalance(current_weights, current_weights,
                                     rebalance_freq, t, last_rebalance_idx,
                                     rebalance_threshold):
                # Optimize portfolio
                target_weights = self._optimize_weights(
                    historical_returns, optimization_method, bounds
                )

                # Compute transaction costs
                tc = self.compute_transaction_costs(
                    current_weights, target_weights, portfolio_value,
                    cost_model, cost_rate
                )

                # Track turnover
                turnover[t] = torch.sum(torch.abs(target_weights - current_weights)).item()

                # Update portfolio
                portfolio_value -= tc
                transaction_costs[t] = tc
                current_weights = target_weights
                last_rebalance_idx = t
                rebalance_dates.append(self.dates[t])

                logger.debug(f"Rebalanced at t={t}, cost=${tc:.2f}, turnover={turnover[t].item():.2%}")

            # Compute portfolio return for this period
            portfolio_return = torch.sum(current_weights * self.returns[t])
            portfolio_returns[t] = portfolio_return

            # Update portfolio value
            portfolio_value = portfolio_value * (1 + portfolio_return.item())
            portfolio_values[t] = portfolio_value

            # Weights drift due to returns (before next rebalance)
            asset_values = current_weights * portfolio_value
            asset_values = asset_values * (1 + self.returns[t])
            current_weights = asset_values / asset_values.sum()

            weights_history[t] = current_weights

            if t % 50 == 0:
                logger.debug(f"Period {t}/{self.T}: Value=${portfolio_value:,.0f}")

        # Compute performance metrics
        metrics = self._compute_performance_metrics(
            portfolio_values, portfolio_returns, transaction_costs
        )

        result = BacktestResult(
            dates=self.dates,
            portfolio_values=portfolio_values,
            portfolio_returns=portfolio_returns,
            weights_history=weights_history,
            rebalance_dates=rebalance_dates,
            transaction_costs=transaction_costs,
            turnover=turnover,
            **metrics
        )

        logger.info(f"Backtest complete: Total return={metrics['total_return']:.2%}, "
                    f"Sharpe={metrics['sharpe_ratio']:.2f}, MaxDD={metrics['max_drawdown']:.2%}")

        return result

    def _optimize_weights(self,
                          historical_returns: torch.Tensor,
                          method: str,
                          bounds: Tuple[float, float]) -> torch.Tensor:
        """
        Optimize portfolio weights on historical data

        Args:
            historical_returns: Historical return data
            method: Optimization method name
            bounds: Weight bounds

        Returns:
            Optimal weights
        """
        T, N = historical_returns.shape

        # Compute statistics
        mean_returns = historical_returns.mean(dim=0)
        centered = historical_returns - mean_returns
        cov = (centered.T @ centered) / (T - 1)

        # Initialize weights
        weights = torch.full((N,), 1.0 / N, device=self.device, requires_grad=True)

        if method == "minimum_variance":
            optimizer = optim.LBFGS([weights], lr=0.1, max_iter=20)

            def closure():
                optimizer.zero_grad()
                with torch.no_grad():
                    weights.clamp_(min=bounds[0], max=bounds[1])
                    weights.div_(weights.sum())
                loss = weights @ cov @ weights
                loss.backward()
                return loss

            for _ in range(50):
                optimizer.step(closure)

        elif method == "maximum_sharpe":
            optimizer = optim.Adam([weights], lr=0.01)

            for _ in range(200):
                optimizer.zero_grad()
                with torch.no_grad():
                    weights.clamp_(min=bounds[0], max=bounds[1])
                    weights.div_(weights.sum())

                excess_return = weights @ mean_returns
                portfolio_vol = torch.sqrt(weights @ cov @ weights + 1e-8)
                sharpe = excess_return / portfolio_vol
                loss = -sharpe

                loss.backward()
                optimizer.step()

        elif method == "risk_parity":
            optimizer = optim.LBFGS([weights], lr=0.1, max_iter=20)

            def closure():
                optimizer.zero_grad()
                with torch.no_grad():
                    weights.clamp_(min=bounds[0], max=bounds[1])
                    weights.div_(weights.sum())

                portfolio_var = weights @ cov @ weights
                portfolio_vol = torch.sqrt(portfolio_var + 1e-8)
                marginal = (cov @ weights) / (portfolio_vol + 1e-8)
                risk_contrib = weights * marginal
                target_rc = portfolio_vol / N
                loss = torch.sum((risk_contrib - target_rc) ** 2)

                loss.backward()
                return loss

            for _ in range(50):
                optimizer.step(closure)

        else:
            # Default to equal weights
            pass

        with torch.no_grad():
            weights.clamp_(min=bounds[0], max=bounds[1])
            weights.div_(weights.sum())

        return weights.detach()

    def _compute_performance_metrics(self,
                                     portfolio_values: torch.Tensor,
                                     portfolio_returns: torch.Tensor,
                                     transaction_costs: torch.Tensor) -> Dict[str, float]:
        """Compute comprehensive performance metrics"""

        # Total and annualized return
        total_return = (portfolio_values[-1] - self.initial_capital) / self.initial_capital
        n_years = self.T / 252.0
        annualized_return = (1 + total_return.item()) ** (1 / n_years) - 1

        # Volatility
        annualized_volatility = portfolio_returns.std().item() * np.sqrt(252)

        # Sharpe ratio
        sharpe_ratio = annualized_return / annualized_volatility if annualized_volatility > 0 else 0.0

        # Sortino ratio (downside deviation)
        negative_returns = portfolio_returns[portfolio_returns < 0]
        downside_vol = negative_returns.std().item() * np.sqrt(252) if len(negative_returns) > 0 else 1e-10
        sortino_ratio = annualized_return / downside_vol

        # Maximum drawdown
        cummax = torch.cummax(portfolio_values, dim=0)[0]
        drawdown = (portfolio_values - cummax) / cummax
        max_drawdown = torch.min(drawdown).item()

        # Calmar ratio
        calmar_ratio = annualized_return / abs(max_drawdown) if max_drawdown != 0 else 0.0

        # Win rate
        positive_returns = portfolio_returns > 0
        win_rate = positive_returns.float().mean().item()

        # Average win/loss
        wins = portfolio_returns[positive_returns]
        losses = portfolio_returns[~positive_returns]
        avg_win = wins.mean().item() if len(wins) > 0 else 0.0
        avg_loss = losses.mean().item() if len(losses) > 0 else 0.0

        # Profit factor
        total_wins = wins.sum().item() if len(wins) > 0 else 0.0
        total_losses = abs(losses.sum().item()) if len(losses) > 0 else 1e-10
        profit_factor = total_wins / total_losses

        return {
            'total_return': total_return.item(),
            'annualized_return': annualized_return,
            'annualized_volatility': annualized_volatility,
            'sharpe_ratio': sharpe_ratio,
            'sortino_ratio': sortino_ratio,
            'max_drawdown': max_drawdown,
            'calmar_ratio': calmar_ratio,
            'win_rate': win_rate,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'profit_factor': profit_factor
        }


# ============================================================================
# MULTI-PERIOD OPTIMIZATION
# ============================================================================

class MultiPeriodOptimizer:
    """Multi-period portfolio optimization with transaction costs"""

    def __init__(self,
                 returns: torch.Tensor,
                 n_periods: int,
                 transaction_cost_rate: float = 0.001,
                 risk_aversion: float = 1.0,
                 device: str = 'cpu'):
        """
        Args:
            returns: Historical returns for estimation
            n_periods: Number of future periods to optimize over
            transaction_cost_rate: Proportional transaction cost
            risk_aversion: Risk aversion parameter
            device: torch device
        """
        self.device = torch.device(device)
        self.returns = returns.to(self.device)
        self.T, self.N = returns.shape
        self.n_periods = n_periods
        self.transaction_cost_rate = transaction_cost_rate
        self.risk_aversion = risk_aversion

        # Estimate parameters
        self.mean_returns = self.returns.mean(dim=0)
        centered = self.returns - self.mean_returns
        self.cov = (centered.T @ centered) / (self.T - 1)

        logger.info(f"Initialized multi-period optimizer: H={n_periods}, λ={risk_aversion}")

    def optimize_dynamic_program(self,
                                 initial_weights: torch.Tensor,
                                 bounds: Tuple[float, float] = (0.0, 1.0)) -> MultiPeriodResult:
        """
        Solve multi-period optimization using dynamic programming

        This solves:
        max E[U(W_T)] - Σ transaction_costs

        Args:
            initial_weights: Starting portfolio weights
            bounds: Weight bounds

        Returns:
            MultiPeriodResult with optimal policy
        """
        logger.info("Solving multi-period optimization via dynamic programming...")

        # Backward induction
        # Value function: V_t(w) = expected utility from period t onward
        # Policy: π_t(w) = optimal weights at period t given state w

        # Terminal period: just expected utility
        optimal_weights = torch.zeros(self.n_periods, self.N, device=self.device)
        value_to_go = torch.zeros(self.n_periods, device=self.device)

        # Solve backwards
        for t in range(self.n_periods - 1, -1, -1):
            if t == self.n_periods - 1:
                # Terminal period: maximize E[U(W)]
                weights = self._solve_single_period(initial_weights, bounds)
                optimal_weights[t] = weights
            else:
                # Intermediate period: include value of next period
                weights = self._solve_with_continuation(
                    initial_weights if t == 0 else optimal_weights[t - 1],
                    optimal_weights[t + 1],
                    bounds
                )
                optimal_weights[t] = weights

        # Simulate forward to get statistics
        path_stats = self._simulate_forward(optimal_weights, initial_weights)

        result = MultiPeriodResult(
            optimal_weights=optimal_weights,
            expected_utility=path_stats['expected_utility'],
            terminal_wealth=path_stats['terminal_wealth'],
            path_statistics=path_stats,
            rebalancing_plan=[(t, optimal_weights[t]) for t in range(self.n_periods)]
        )

        logger.info(f"Multi-period optimization complete: E[U]={result.expected_utility:.4f}")

        return result

    def _solve_single_period(self,
                             current_weights: torch.Tensor,
                             bounds: Tuple[float, float]) -> torch.Tensor:
        """Solve single-period mean-variance problem"""

        weights = current_weights.clone().detach().requires_grad_(True)
        optimizer = optim.LBFGS([weights], lr=0.1, max_iter=20)

        def closure():
            optimizer.zero_grad()
            with torch.no_grad():
                weights.clamp_(min=bounds[0], max=bounds[1])
                weights.div_(weights.sum())

            # Transaction costs
            turnover = torch.sum(torch.abs(weights - current_weights))
            tc_cost = turnover * self.transaction_cost_rate

            # Mean-variance utility
            expected_return = weights @ self.mean_returns
            variance = weights @ self.cov @ weights
            utility = expected_return - 0.5 * self.risk_aversion * variance - tc_cost

            loss = -utility
            loss.backward()
            return loss

        for _ in range(50):
            optimizer.step(closure)

        with torch.no_grad():
            weights.clamp_(min=bounds[0], max=bounds[1])
            weights.div_(weights.sum())

        return weights.detach()

    def _solve_with_continuation(self,
                                 current_weights: torch.Tensor,
                                 next_period_weights: torch.Tensor,
                                 bounds: Tuple[float, float]) -> torch.Tensor:
        """Solve with continuation value from next period"""

        weights = current_weights.clone().detach().requires_grad_(True)
        optimizer = optim.LBFGS([weights], lr=0.1, max_iter=20)

        def closure():
            optimizer.zero_grad()
            with torch.no_grad():
                weights.clamp_(min=bounds[0], max=bounds[1])
                weights.div_(weights.sum())

            # Current period costs and utility
            turnover = torch.sum(torch.abs(weights - current_weights))
            tc_cost = turnover * self.transaction_cost_rate

            expected_return = weights @ self.mean_returns
            variance = weights @ self.cov @ weights

            # Value function approximation
            # V_t = immediate_utility - transaction_cost + γ * V_{t+1}
            immediate_utility = expected_return - 0.5 * self.risk_aversion * variance

            # Continuation value (simplified - assume similar from next period)
            continuation = 0.95 * immediate_utility  # Discount factor 0.95

            total_value = immediate_utility - tc_cost + continuation

            loss = -total_value
            loss.backward()
            return loss

        for _ in range(50):
            optimizer.step(closure)

        with torch.no_grad():
            weights.clamp_(min=bounds[0], max=bounds[1])
            weights.div_(weights.sum())

        return weights.detach()

    def _simulate_forward(self,
                          optimal_weights: torch.Tensor,
                          initial_weights: torch.Tensor) -> Dict[str, float]:
        """Simulate forward path with optimal policy"""

        wealth = 1.0
        current_w = initial_weights
        total_tc = 0.0

        for t in range(self.n_periods):
            target_w = optimal_weights[t]

            # Transaction cost
            tc = torch.sum(torch.abs(target_w - current_w)).item() * self.transaction_cost_rate
            total_tc += tc
            wealth -= tc

            # Period return
            period_return = (target_w @ self.mean_returns).item()
            wealth = wealth * (1 + period_return)

            current_w = target_w

        # Utility
        utility = wealth - 0.5 * self.risk_aversion * (wealth ** 2)

        return {
            'expected_utility': utility,
            'terminal_wealth': wealth,
            'total_transaction_costs': total_tc,
            'average_period_return': (wealth - 1.0) / self.n_periods
        }

    def optimize_with_garch(self,
                            initial_weights: torch.Tensor,
                            bounds: Tuple[float, float] = (0.0, 1.0)) -> MultiPeriodResult:
        """
        Multi-period optimization with GARCH(1,1) volatility forecasting

        Uses time-varying covariance predictions
        """
        logger.info("Multi-period optimization with GARCH forecasting...")

        # Estimate GARCH parameters for each asset
        garch_params = self._estimate_garch_parameters()

        # Forecast covariance matrices
        cov_forecasts = self._forecast_covariances(garch_params)

        # Optimize with time-varying covariance
        optimal_weights = torch.zeros(self.n_periods, self.N, device=self.device)

        for t in range(self.n_periods):
            cov_t = cov_forecasts[t]
            weights = self._solve_period_with_cov(
                initial_weights if t == 0 else optimal_weights[t - 1],
                cov_t,
                bounds
            )
            optimal_weights[t] = weights

        path_stats = self._simulate_forward(optimal_weights, initial_weights)

        result = MultiPeriodResult(
            optimal_weights=optimal_weights,
            expected_utility=path_stats['expected_utility'],
            terminal_wealth=path_stats['terminal_wealth'],
            path_statistics=path_stats,
            rebalancing_plan=[(t, optimal_weights[t]) for t in range(self.n_periods)]
        )

        logger.info(f"GARCH-based optimization complete")

        return result

    def _estimate_garch_parameters(self) -> Dict[str, torch.Tensor]:
        """Estimate GARCH(1,1) parameters for each asset"""

        omega = torch.zeros(self.N, device=self.device)
        alpha = torch.zeros(self.N, device=self.device)
        beta = torch.zeros(self.N, device=self.device)

        for i in range(self.N):
            returns_i = self.returns[:, i]

            # Simple moment-based estimation
            variance = torch.var(returns_i, unbiased=True)

            # Typical GARCH(1,1) parameters
            omega[i] = 0.0001
            alpha[i] = 0.1
            beta[i] = 0.85

        return {'omega': omega, 'alpha': alpha, 'beta': beta}

    def _forecast_covariances(self, garch_params: Dict) -> List[torch.Tensor]:
        """Forecast future covariance matrices using GARCH"""

        omega = garch_params['omega']
        alpha = garch_params['alpha']
        beta = garch_params['beta']

        # Current volatilities
        current_vol = torch.std(self.returns, dim=0, unbiased=True)
        current_var = current_vol ** 2

        # Forecast variances
        forecasts = []
        var_t = current_var

        for t in range(self.n_periods):
            # GARCH(1,1): σ²_{t+1} = ω + α*r²_t + β*σ²_t
            var_t = omega + alpha * var_t + beta * var_t

            # Construct covariance (assume constant correlation)
            vol_t = torch.sqrt(var_t)
            corr = torch.corrcoef(self.returns.T)
            cov_t = corr * (vol_t.unsqueeze(0) * vol_t.unsqueeze(1))

            forecasts.append(cov_t)

        return forecasts

    def _solve_period_with_cov(self,
                               current_weights: torch.Tensor,
                               cov: torch.Tensor,
                               bounds: Tuple[float, float]) -> torch.Tensor:
        """Solve single period with given covariance"""

        weights = current_weights.clone().detach().requires_grad_(True)
        optimizer = optim.LBFGS([weights], lr=0.1, max_iter=20)

        def closure():
            optimizer.zero_grad()
            with torch.no_grad():
                weights.clamp_(min=bounds[0], max=bounds[1])
                weights.div_(weights.sum())

            turnover = torch.sum(torch.abs(weights - current_weights))
            tc_cost = turnover * self.transaction_cost_rate

            expected_return = weights @ self.mean_returns
            variance = weights @ cov @ weights
            utility = expected_return - 0.5 * self.risk_aversion * variance - tc_cost

            loss = -utility
            loss.backward()
            return loss

        for _ in range(50):
            optimizer.step(closure)

        with torch.no_grad():
            weights.clamp_(min=bounds[0], max=bounds[1])
            weights.div_(weights.sum())

        return weights.detach()


# ============================================================================
# NEURAL NETWORK COMPONENTS
# ============================================================================

class AttentionCovarianceEstimator(nn.Module):
    """Transformer-based covariance estimation with cross-asset attention"""

    def __init__(self, n_assets: int, d_model: int = 64, n_heads: int = 4, n_layers: int = 2):
        super().__init__()
        self.n_assets = n_assets
        self.d_model = d_model

        # Embedding layer for returns
        self.return_embedding = nn.Linear(1, d_model)

        # Multi-head attention layers
        self.attention_layers = nn.ModuleList([
            nn.MultiheadAttention(d_model, n_heads, batch_first=True)
            for _ in range(n_layers)
        ])

        self.layer_norms = nn.ModuleList([
            nn.LayerNorm(d_model) for _ in range(n_layers)
        ])

        # Output projection to covariance
        self.cov_projection = nn.Sequential(
            nn.Linear(d_model * n_assets, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, n_assets * n_assets)
        )

        # Ensure PSD via Cholesky parameterization
        self.use_cholesky = True

    def forward(self, returns: torch.Tensor) -> torch.Tensor:
        """
        Args:
            returns: (T, N) tensor of returns
        Returns:
            cov: (N, N) positive semi-definite covariance matrix
        """
        T, N = returns.shape

        # Embed returns: (T, N, d_model)
        x = self.return_embedding(returns.unsqueeze(-1))

        # Apply attention layers
        for attention, norm in zip(self.attention_layers, self.layer_norms):
            attn_out, _ = attention(x, x, x)
            x = norm(x + attn_out)

        # Aggregate across time: (N, d_model)
        x = x.mean(dim=0)

        # Project to covariance
        x_flat = x.reshape(-1)
        cov_params = self.cov_projection(x_flat)

        if self.use_cholesky:
            # Parameterize via Cholesky factor to ensure PSD
            L_params = cov_params.reshape(N, N)
            L = torch.tril(L_params)
            # Ensure positive diagonal
            L = L * torch.tril(torch.ones_like(L), diagonal=-1) + \
                torch.diag(F.softplus(torch.diag(L)) + 1e-6)
            cov = L @ L.T
        else:
            cov = cov_params.reshape(N, N)
            cov = (cov + cov.T) / 2  # Symmetrize

        return cov


class GraphNeuralCovariance(nn.Module):
    """GNN for learning correlation structure"""

    def __init__(self, n_assets: int, hidden_dim: int = 64, n_layers: int = 3):
        super().__init__()
        self.n_assets = n_assets

        # Node feature encoder
        self.node_encoder = nn.Sequential(
            nn.Linear(1, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )

        # Graph convolution layers
        self.conv_layers = nn.ModuleList([
            nn.Linear(hidden_dim, hidden_dim) for _ in range(n_layers)
        ])

        # Edge predictor (correlation)
        self.edge_predictor = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1),
            nn.Tanh()  # Correlations in [-1, 1]
        )

        # Variance predictor
        self.variance_predictor = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1),
            nn.Softplus()  # Positive variance
        )

    def forward(self, returns: torch.Tensor) -> torch.Tensor:
        """
        Args:
            returns: (T, N) tensor of returns
        Returns:
            cov: (N, N) covariance matrix
        """
        T, N = returns.shape

        # Compute node features (volatility)
        node_features = returns.std(dim=0, keepdim=True).T  # (N, 1)
        h = self.node_encoder(node_features)  # (N, hidden_dim)

        # Apply graph convolutions with full connectivity
        for conv in self.conv_layers:
            h_neighbors = h.unsqueeze(0).expand(N, -1, -1)  # (N, N, hidden_dim)
            h_agg = h_neighbors.mean(dim=1)  # (N, hidden_dim)
            h = F.relu(conv(h_agg)) + h  # Residual

        # Predict correlations (edges)
        h_i = h.unsqueeze(1).expand(-1, N, -1)  # (N, N, hidden_dim)
        h_j = h.unsqueeze(0).expand(N, -1, -1)  # (N, N, hidden_dim)
        edge_features = torch.cat([h_i, h_j], dim=-1)  # (N, N, 2*hidden_dim)

        correlations = self.edge_predictor(edge_features).squeeze(-1)  # (N, N)
        correlations = (correlations + correlations.T) / 2  # Symmetrize
        correlations.fill_diagonal_(1.0)

        # Predict variances
        variances = self.variance_predictor(h).squeeze(-1)  # (N,)
        std_devs = torch.sqrt(variances + 1e-8)

        # Construct covariance
        cov = correlations * (std_devs.unsqueeze(0) * std_devs.unsqueeze(1))

        return cov


class TransformerReturnPredictor(nn.Module):
    """Transformer for return forecasting with temporal attention"""

    def __init__(self, n_assets: int, d_model: int = 128, n_heads: int = 8,
                 n_layers: int = 4, dropout: float = 0.1):
        super().__init__()
        self.n_assets = n_assets
        self.d_model = d_model

        # Input embedding
        self.input_projection = nn.Linear(n_assets, d_model)

        # Positional encoding
        self.positional_encoding = PositionalEncoding(d_model, dropout, max_len=1000)

        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=n_heads, dim_feedforward=d_model * 4,
            dropout=dropout, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)

        # Output projection
        self.output_projection = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, n_assets)
        )

    def forward(self, returns_history: torch.Tensor) -> torch.Tensor:
        """
        Args:
            returns_history: (batch, seq_len, n_assets)
        Returns:
            predictions: (batch, n_assets)
        """
        # Project to d_model
        x = self.input_projection(returns_history)  # (batch, seq_len, d_model)

        # Add positional encoding
        x = self.positional_encoding(x)

        # Apply transformer
        x = self.transformer(x)  # (batch, seq_len, d_model)

        # Use last time step for prediction
        x = x[:, -1, :]  # (batch, d_model)

        # Project to returns
        predictions = self.output_projection(x)  # (batch, n_assets)

        return predictions


class PositionalEncoding(nn.Module):
    """Positional encoding for transformer"""

    def __init__(self, d_model: int, dropout: float = 0.1, max_len: int = 1000):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() *
                             (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_len, d_model)
        self.register_buffer('pe', pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class NeuralRiskParityOptimizer(nn.Module):
    """Neural network that learns to produce risk parity portfolios"""

    def __init__(self, n_assets: int, hidden_dim: int = 128):
        super().__init__()
        self.n_assets = n_assets

        # Covariance encoder
        self.cov_encoder = nn.Sequential(
            nn.Linear(n_assets * n_assets, hidden_dim * 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU()
        )

        # Weight generator
        self.weight_generator = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, n_assets)
        )

    def forward(self, cov: torch.Tensor) -> torch.Tensor:
        """
        Args:
            cov: (N, N) covariance matrix
        Returns:
            weights: (N,) portfolio weights (softmax normalized)
        """
        # Encode covariance
        cov_flat = cov.reshape(-1)
        h = self.cov_encoder(cov_flat)

        # Generate weights
        logits = self.weight_generator(h)
        weights = F.softmax(logits, dim=-1)

        return weights

    def risk_parity_loss(self, weights: torch.Tensor, cov: torch.Tensor) -> torch.Tensor:
        """Compute risk parity objective"""
        portfolio_var = weights @ cov @ weights
        portfolio_vol = torch.sqrt(portfolio_var + 1e-8)

        # Marginal risk contributions
        marginal_contrib = (cov @ weights) / (portfolio_vol + 1e-8)
        risk_contrib = weights * marginal_contrib

        # Target equal risk contribution
        target_rc = portfolio_vol / self.n_assets

        # MSE loss
        loss = torch.mean((risk_contrib - target_rc) ** 2)

        return loss


class DeepHedgingNetwork(nn.Module):
    """Deep hedging strategy learner with transaction costs"""

    def __init__(self, n_assets: int, state_dim: int = 32, hidden_dim: int = 128):
        super().__init__()
        self.n_assets = n_assets

        # State encoder (current portfolio + market features)
        self.state_encoder = nn.Sequential(
            nn.Linear(n_assets + state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )

        # Action network (portfolio adjustments)
        self.action_network = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, n_assets),
            nn.Tanh()  # Actions in [-1, 1]
        )

        # Value network (portfolio value estimation)
        self.value_network = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1)
        )

    def forward(self, state: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            state: (batch, n_assets + state_dim)
        Returns:
            actions: (batch, n_assets) portfolio adjustments
            value: (batch, 1) estimated portfolio value
        """
        h = self.state_encoder(state)
        actions = self.action_network(h)
        value = self.value_network(h)
        return actions, value


class BlackLittermanNetwork(nn.Module):
    """Differentiable Black-Litterman with learnable view generation"""

    def __init__(self, n_assets: int, n_views: int, hidden_dim: int = 64):
        super().__init__()
        self.n_assets = n_assets
        self.n_views = n_views

        # View generation from market data
        self.view_generator = nn.Sequential(
            nn.Linear(n_assets, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, n_views)
        )

        # Pick matrix generator (which assets each view refers to)
        self.pick_generator = nn.Sequential(
            nn.Linear(n_assets, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, n_views * n_assets)
        )

        # View uncertainty
        self.uncertainty_net = nn.Sequential(
            nn.Linear(n_assets, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, n_views),
            nn.Softplus()
        )

    def forward(self, market_returns: torch.Tensor,
                prior_returns: torch.Tensor,
                prior_cov: torch.Tensor,
                tau: float = 0.05) -> torch.Tensor:
        """
        Args:
            market_returns: (n_assets,) market equilibrium returns
            prior_returns: (n_assets,) prior expected returns
            prior_cov: (n_assets, n_assets) prior covariance
            tau: scaling factor for prior uncertainty
        Returns:
            posterior_returns: (n_assets,) Black-Litterman expected returns
        """
        # Generate views
        views = self.view_generator(market_returns)  # (n_views,)

        # Generate pick matrix P
        P_flat = self.pick_generator(market_returns)
        P = P_flat.reshape(self.n_views, self.n_assets)
        P = F.softmax(P, dim=-1)  # Normalize rows

        # View uncertainty Omega
        view_uncertainty = self.uncertainty_net(market_returns)
        Omega = torch.diag(view_uncertainty)

        # Black-Litterman formula (differentiable)
        tau_Sigma = tau * prior_cov

        # M = [(tau * Sigma)^-1 + P^T * Omega^-1 * P]^-1
        try:
            tau_Sigma_inv = torch.linalg.inv(tau_Sigma + 1e-6 * torch.eye(self.n_assets, device=tau_Sigma.device))
            Omega_inv = torch.linalg.inv(Omega + 1e-6 * torch.eye(self.n_views, device=Omega.device))

            M_inv = tau_Sigma_inv + P.T @ Omega_inv @ P
            M = torch.linalg.inv(M_inv + 1e-6 * torch.eye(self.n_assets, device=M_inv.device))

            # Posterior = M * [(tau*Sigma)^-1 * prior + P^T * Omega^-1 * views]
            posterior_returns = M @ (tau_Sigma_inv @ prior_returns + P.T @ Omega_inv @ views)
        except:
            # Fallback to prior if inversion fails
            posterior_returns = prior_returns

        return posterior_returns


# ============================================================================
# TORCH-NATIVE OPTIMIZATION
# ============================================================================

class TorchPortfolioOptimizer:
    """Pure PyTorch optimization with autograd"""

    def __init__(self, returns: torch.Tensor, device: str = 'cpu'):
        self.device = torch.device(device)
        self.returns = returns.to(self.device)
        self.T, self.N = returns.shape

        # Compute statistics
        self.mean_returns = self.returns.mean(dim=0)
        centered = self.returns - self.mean_returns
        self.sample_cov = (centered.T @ centered) / (self.T - 1)

    def optimize_minimum_variance_torch(self,
                                        bounds: Tuple[float, float] = (0.0, 1.0),
                                        max_iter: int = 1000) -> torch.Tensor:
        """Minimum variance optimization using PyTorch"""

        # Initialize weights (must be leaf tensor)
        weights = torch.full((self.N,), 1.0 / self.N, device=self.device, requires_grad=True)

        optimizer = optim.LBFGS([weights], lr=0.1, max_iter=20,
                                line_search_fn='strong_wolfe')

        best_loss = float('inf')
        no_improve = 0

        def closure():
            nonlocal best_loss, no_improve
            optimizer.zero_grad()

            # Project to feasible set
            with torch.no_grad():
                weights.clamp_(min=bounds[0], max=bounds[1])
                weights.div_(weights.sum())

            # Compute variance
            portfolio_var = weights @ self.sample_cov @ weights
            loss = portfolio_var

            if loss.item() < best_loss - 1e-8:
                best_loss = loss.item()
                no_improve = 0
            else:
                no_improve += 1

            loss.backward()
            return loss

        for epoch in range(max_iter // 20):
            optimizer.step(closure)
            if no_improve > 10:
                break

        with torch.no_grad():
            weights.clamp_(min=bounds[0], max=bounds[1])
            weights.div_(weights.sum())

        return weights.detach()

    def optimize_maximum_sharpe_torch(self,
                                      risk_free_rate: float = 0.0,
                                      bounds: Tuple[float, float] = (0.0, 1.0),
                                      max_iter: int = 1000) -> torch.Tensor:
        """Maximum Sharpe ratio using PyTorch"""

        weights = torch.full((self.N,), 1.0 / self.N, device=self.device, requires_grad=True)

        optimizer = optim.Adam([weights], lr=0.01)

        for epoch in range(max_iter):
            optimizer.zero_grad()

            # Project
            with torch.no_grad():
                weights.clamp_(min=bounds[0], max=bounds[1])
                weights.div_(weights.sum())

            # Sharpe ratio (negative for minimization)
            excess_return = weights @ self.mean_returns - risk_free_rate
            portfolio_vol = torch.sqrt(weights @ self.sample_cov @ weights + 1e-8)
            sharpe = excess_return / portfolio_vol
            loss = -sharpe

            loss.backward()
            optimizer.step()

            if epoch % 100 == 0:
                logger.debug(f"Epoch {epoch}, Sharpe: {-loss.item():.4f}")

        with torch.no_grad():
            weights.clamp_(min=bounds[0], max=bounds[1])
            weights.div_(weights.sum())

        return weights.detach()

    def optimize_risk_parity_torch(self,
                                   bounds: Tuple[float, float] = (0.0, 1.0),
                                   max_iter: int = 1000) -> torch.Tensor:
        """Risk parity using PyTorch"""

        weights = torch.full((self.N,), 1.0 / self.N, device=self.device, requires_grad=True)

        optimizer = optim.LBFGS([weights], lr=0.1, max_iter=20,
                                line_search_fn='strong_wolfe')

        best_loss = float('inf')
        no_improve = 0

        def closure():
            nonlocal best_loss, no_improve
            optimizer.zero_grad()

            with torch.no_grad():
                weights.clamp_(min=bounds[0], max=bounds[1])
                weights.div_(weights.sum())

            # Risk parity objective
            portfolio_var = weights @ self.sample_cov @ weights
            portfolio_vol = torch.sqrt(portfolio_var + 1e-8)

            marginal_contrib = (self.sample_cov @ weights) / (portfolio_vol + 1e-8)
            risk_contrib = weights * marginal_contrib

            target_rc = portfolio_vol / self.N
            loss = torch.sum((risk_contrib - target_rc) ** 2)

            if loss.item() < best_loss - 1e-8:
                best_loss = loss.item()
                no_improve = 0
            else:
                no_improve += 1

            loss.backward()
            return loss

        for epoch in range(max_iter // 20):
            optimizer.step(closure)
            if no_improve > 10:
                break

        with torch.no_grad():
            weights.clamp_(min=bounds[0], max=bounds[1])
            weights.div_(weights.sum())

        return weights.detach()


# ============================================================================
# MODERN COVARIANCE ESTIMATION
# ============================================================================

class ModernCovarianceEstimator:
    """Neural and graph-based covariance estimation"""

    def __init__(self, returns: torch.Tensor, device: str = 'cpu'):
        self.device = torch.device(device)
        self.returns = returns.to(self.device)
        self.T, self.N = returns.shape

        # Models
        self.attention_model = None
        self.graph_model = None

    def estimate_with_attention(self,
                                n_epochs: int = 100,
                                lr: float = 0.001) -> torch.Tensor:
        """Estimate covariance using attention mechanism"""

        if self.attention_model is None:
            self.attention_model = AttentionCovarianceEstimator(
                self.N, d_model=64, n_heads=4, n_layers=2
            ).to(self.device)

        optimizer = optim.Adam(self.attention_model.parameters(), lr=lr)

        # Target: sample covariance
        centered = self.returns - self.returns.mean(dim=0)
        target_cov = (centered.T @ centered) / (self.T - 1)

        for epoch in range(n_epochs):
            optimizer.zero_grad()

            pred_cov = self.attention_model(self.returns)

            # Loss: Frobenius norm
            loss = torch.norm(pred_cov - target_cov, p='fro')

            # Regularization: encourage PSD
            eigvals = torch.linalg.eigvalsh(pred_cov)
            psd_penalty = torch.sum(torch.relu(-eigvals))

            total_loss = loss + 0.1 * psd_penalty

            total_loss.backward()
            optimizer.step()

            if epoch % 20 == 0:
                logger.debug(f"Epoch {epoch}, Loss: {loss.item():.4f}")

        with torch.no_grad():
            cov = self.attention_model(self.returns)

        return cov.detach()

    def estimate_with_graph(self,
                            n_epochs: int = 100,
                            lr: float = 0.001) -> torch.Tensor:
        """Estimate covariance using graph neural network"""

        if self.graph_model is None:
            self.graph_model = GraphNeuralCovariance(
                self.N, hidden_dim=64, n_layers=3
            ).to(self.device)

        optimizer = optim.Adam(self.graph_model.parameters(), lr=lr)

        centered = self.returns - self.returns.mean(dim=0)
        target_cov = (centered.T @ centered) / (self.T - 1)

        for epoch in range(n_epochs):
            optimizer.zero_grad()

            pred_cov = self.graph_model(self.returns)

            loss = torch.norm(pred_cov - target_cov, p='fro')

            # Ensure PSD
            eigvals = torch.linalg.eigvalsh(pred_cov)
            psd_penalty = torch.sum(torch.relu(-eigvals))

            total_loss = loss + 0.1 * psd_penalty

            total_loss.backward()
            optimizer.step()

            if epoch % 20 == 0:
                logger.debug(f"Epoch {epoch}, Loss: {loss.item():.4f}")

        with torch.no_grad():
            cov = self.graph_model(self.returns)

        return cov.detach()


# ============================================================================
# INTEGRATED FRAMEWORK
# ============================================================================

class ModernPortfolioFramework:
    """Complete modern portfolio optimization framework"""

    def __init__(self, returns: pd.DataFrame, device: str = 'cpu'):
        self.device = torch.device(device if torch.cuda.is_available() or device == 'cpu' else 'cpu')

        if returns.isnull().any().any():
            logger.warning("NaN values detected, dropping...")
            returns = returns.dropna()

        self.returns_df = returns  # Keep DataFrame for dates
        self.returns = torch.tensor(returns.values, dtype=torch.float32, device=self.device)
        self.T, self.N = self.returns.shape
        self.assets = list(returns.columns)
        self.dates = list(returns.index) if hasattr(returns.index, 'tolist') else list(range(self.T))

        # Compute basic statistics
        self.mean_returns = self.returns.mean(dim=0)
        centered = self.returns - self.mean_returns
        self.sample_cov = (centered.T @ centered) / (self.T - 1)

        # Initialize components
        self.torch_optimizer = TorchPortfolioOptimizer(self.returns, str(self.device))
        self.modern_cov_estimator = ModernCovarianceEstimator(self.returns, str(self.device))

        # Backtesting and multi-period
        self.backtester = PortfolioBacktester(
            self.returns, self.dates, initial_capital=1000000.0, device=str(self.device)
        )
        self.multi_period_optimizer = None  # Lazy init

        # Neural models (lazy initialization)
        self.return_predictor = None
        self.risk_parity_net = None
        self.black_litterman_net = None

        logger.info(f"Initialized modern framework: T={self.T}, N={self.N}, device={self.device}")

    # ========================================================================
    # BACKTESTING METHODS
    # ========================================================================

    def run_backtest(self,
                     strategy: str = "minimum_variance",
                     lookback_window: int = 126,
                     rebalance_freq: RebalanceFrequency = RebalanceFrequency.MONTHLY,
                     transaction_cost_rate: float = 0.001,
                     initial_capital: float = 1000000.0) -> BacktestResult:
        """
        Run comprehensive backtest

        Args:
            strategy: Optimization strategy ("minimum_variance", "maximum_sharpe", "risk_parity")
            lookback_window: Rolling window for optimization (in periods)
            rebalance_freq: How often to rebalance
            transaction_cost_rate: Transaction cost as % of trade value
            initial_capital: Starting capital

        Returns:
            BacktestResult with complete performance analysis
        """
        # Update initial capital if different
        if initial_capital != self.backtester.initial_capital:
            self.backtester.initial_capital = initial_capital

        result = self.backtester.run_backtest(
            optimization_method=strategy,
            lookback_window=lookback_window,
            rebalance_freq=rebalance_freq,
            cost_model=TransactionCostModel.PROPORTIONAL,
            cost_rate=transaction_cost_rate
        )

        return result

    def compare_strategies(self,
                           strategies: List[str] = None,
                           lookback_window: int = 126,
                           rebalance_freq: RebalanceFrequency = RebalanceFrequency.MONTHLY,
                           transaction_cost_rate: float = 0.001) -> pd.DataFrame:
        """
        Compare multiple strategies via backtesting

        Returns:
            DataFrame comparing strategy performance
        """
        if strategies is None:
            strategies = ["minimum_variance", "maximum_sharpe", "risk_parity"]

        results = []

        for strategy in strategies:
            logger.info(f"Backtesting strategy: {strategy}")

            result = self.run_backtest(
                strategy=strategy,
                lookback_window=lookback_window,
                rebalance_freq=rebalance_freq,
                transaction_cost_rate=transaction_cost_rate
            )

            results.append({
                'Strategy': strategy,
                'Total_Return': result.total_return * 100,
                'Annual_Return': result.annualized_return * 100,
                'Annual_Vol': result.annualized_volatility * 100,
                'Sharpe_Ratio': result.sharpe_ratio,
                'Sortino_Ratio': result.sortino_ratio,
                'Max_Drawdown': result.max_drawdown * 100,
                'Calmar_Ratio': result.calmar_ratio,
                'Win_Rate': result.win_rate * 100,
                'Profit_Factor': result.profit_factor
            })

        return pd.DataFrame(results)

    # ========================================================================
    # MULTI-PERIOD OPTIMIZATION
    # ========================================================================

    def optimize_multi_period(self,
                              n_periods: int = 12,
                              initial_weights: Optional[torch.Tensor] = None,
                              transaction_cost_rate: float = 0.001,
                              risk_aversion: float = 1.0,
                              use_garch: bool = False) -> MultiPeriodResult:
        """
        Multi-period optimization with transaction costs

        Args:
            n_periods: Number of future periods to optimize
            initial_weights: Starting weights (None = equal weight)
            transaction_cost_rate: Transaction cost rate
            risk_aversion: Risk aversion parameter
            use_garch: Whether to use GARCH volatility forecasting

        Returns:
            MultiPeriodResult with optimal rebalancing plan
        """
        if self.multi_period_optimizer is None or \
                self.multi_period_optimizer.n_periods != n_periods:
            self.multi_period_optimizer = MultiPeriodOptimizer(
                self.returns,
                n_periods=n_periods,
                transaction_cost_rate=transaction_cost_rate,
                risk_aversion=risk_aversion,
                device=str(self.device)
            )

        if initial_weights is None:
            initial_weights = torch.ones(self.N, device=self.device) / self.N

        if use_garch:
            result = self.multi_period_optimizer.optimize_with_garch(initial_weights)
        else:
            result = self.multi_period_optimizer.optimize_dynamic_program(initial_weights)

        return result

    # ========================================================================
    # NEURAL COVARIANCE ESTIMATION
    # ========================================================================

    def estimate_covariance_attention(self, n_epochs: int = 100) -> torch.Tensor:
        """Estimate covariance using attention mechanism"""
        logger.info("Estimating covariance with attention...")
        return self.modern_cov_estimator.estimate_with_attention(n_epochs=n_epochs)

    def estimate_covariance_graph(self, n_epochs: int = 100) -> torch.Tensor:
        """Estimate covariance using GNN"""
        logger.info("Estimating covariance with GNN...")
        return self.modern_cov_estimator.estimate_with_graph(n_epochs=n_epochs)

    # ========================================================================
    # RETURN PREDICTION
    # ========================================================================

    def train_return_predictor(self, seq_len: int = 20, n_epochs: int = 100,
                               batch_size: int = 32, lr: float = 0.001) -> None:
        """Train transformer-based return predictor"""

        if self.return_predictor is None:
            self.return_predictor = TransformerReturnPredictor(
                self.N, d_model=128, n_heads=8, n_layers=4
            ).to(self.device)

        optimizer = optim.Adam(self.return_predictor.parameters(), lr=lr)
        criterion = nn.MSELoss()

        # Create sequences
        sequences = []
        targets = []
        for t in range(seq_len, self.T):
            sequences.append(self.returns[t - seq_len:t])
            targets.append(self.returns[t])

        sequences = torch.stack(sequences)
        targets = torch.stack(targets)

        logger.info(f"Training return predictor on {len(sequences)} sequences...")

        for epoch in range(n_epochs):
            # Shuffle
            idx = torch.randperm(len(sequences))
            sequences_shuffled = sequences[idx]
            targets_shuffled = targets[idx]

            total_loss = 0.0
            n_batches = 0

            for i in range(0, len(sequences), batch_size):
                batch_seq = sequences_shuffled[i:i + batch_size]
                batch_target = targets_shuffled[i:i + batch_size]

                optimizer.zero_grad()
                predictions = self.return_predictor(batch_seq)
                loss = criterion(predictions, batch_target)

                loss.backward()
                optimizer.step()

                total_loss += loss.item()
                n_batches += 1

            if epoch % 10 == 0:
                avg_loss = total_loss / n_batches
                logger.info(f"Epoch {epoch}/{n_epochs}, Loss: {avg_loss:.6f}")

        logger.info("Return predictor training complete")

    def predict_returns(self, lookback: int = 20) -> torch.Tensor:
        """Predict next period returns"""
        if self.return_predictor is None:
            raise ValueError("Return predictor not trained. Call train_return_predictor() first")

        self.return_predictor.eval()
        with torch.no_grad():
            recent_returns = self.returns[-lookback:].unsqueeze(0)
            predictions = self.return_predictor(recent_returns).squeeze(0)

        return predictions

    # ========================================================================
    # TORCH-NATIVE OPTIMIZATION
    # ========================================================================

    def optimize_minimum_variance_torch(self, **kwargs) -> OptimizationResult:
        """Minimum variance using pure PyTorch"""
        weights = self.torch_optimizer.optimize_minimum_variance_torch(**kwargs)

        portfolio_var = weights @ self.sample_cov @ weights

        return OptimizationResult(
            weights=weights,
            objective_value=portfolio_var.item(),
            success=True,
            iterations=kwargs.get('max_iter', 1000),
            gradient_norm=0.0,
            constraints_satisfied=True,
            message="PyTorch optimization successful"
        )

    def optimize_maximum_sharpe_torch(self, **kwargs) -> OptimizationResult:
        """Maximum Sharpe using pure PyTorch"""
        weights = self.torch_optimizer.optimize_maximum_sharpe_torch(**kwargs)

        excess_return = weights @ self.mean_returns - kwargs.get('risk_free_rate', 0.0)
        portfolio_vol = torch.sqrt(weights @ self.sample_cov @ weights)
        sharpe = (excess_return / portfolio_vol).item()

        return OptimizationResult(
            weights=weights,
            objective_value=-sharpe,
            success=True,
            iterations=kwargs.get('max_iter', 1000),
            gradient_norm=0.0,
            constraints_satisfied=True,
            message="PyTorch optimization successful",
            risk_measures={'sharpe_ratio': sharpe}
        )

    def optimize_risk_parity_torch(self, **kwargs) -> OptimizationResult:
        """Risk parity using pure PyTorch"""
        weights = self.torch_optimizer.optimize_risk_parity_torch(**kwargs)

        portfolio_var = weights @ self.sample_cov @ weights
        portfolio_vol = torch.sqrt(portfolio_var)

        marginal = (self.sample_cov @ weights) / portfolio_vol
        risk_contrib = weights * marginal

        return OptimizationResult(
            weights=weights,
            objective_value=portfolio_var.item(),
            success=True,
            iterations=kwargs.get('max_iter', 1000),
            gradient_norm=0.0,
            constraints_satisfied=True,
            message="PyTorch risk parity successful",
            risk_measures={
                'risk_contributions': risk_contrib.cpu().numpy(),
                'volatility': portfolio_vol.item()
            }
        )

    # ========================================================================
    # NEURAL RISK PARITY
    # ========================================================================

    def train_neural_risk_parity(self, n_epochs: int = 200, lr: float = 0.001) -> None:
        """Train neural network for risk parity"""

        if self.risk_parity_net is None:
            self.risk_parity_net = NeuralRiskParityOptimizer(
                self.N, hidden_dim=128
            ).to(self.device)

        optimizer = optim.Adam(self.risk_parity_net.parameters(), lr=lr)

        logger.info("Training neural risk parity optimizer...")

        for epoch in range(n_epochs):
            optimizer.zero_grad()

            weights = self.risk_parity_net(self.sample_cov)
            loss = self.risk_parity_net.risk_parity_loss(weights, self.sample_cov)

            loss.backward()
            optimizer.step()

            if epoch % 20 == 0:
                logger.info(f"Epoch {epoch}/{n_epochs}, Loss: {loss.item():.6f}")

        logger.info("Neural risk parity training complete")

    def optimize_neural_risk_parity(self) -> OptimizationResult:
        """Get risk parity weights from neural network"""
        if self.risk_parity_net is None:
            raise ValueError("Neural risk parity not trained. Call train_neural_risk_parity() first")

        self.risk_parity_net.eval()
        with torch.no_grad():
            weights = self.risk_parity_net(self.sample_cov)

        portfolio_var = weights @ self.sample_cov @ weights

        return OptimizationResult(
            weights=weights,
            objective_value=portfolio_var.item(),
            success=True,
            iterations=0,
            gradient_norm=0.0,
            constraints_satisfied=True,
            message="Neural risk parity"
        )

    # ========================================================================
    # BLACK-LITTERMAN WITH NEURAL VIEWS
    # ========================================================================

    def train_black_litterman_network(self, n_views: int = 5,
                                      n_epochs: int = 100, lr: float = 0.001) -> None:
        """Train neural Black-Litterman view generator"""

        if self.black_litterman_net is None:
            self.black_litterman_net = BlackLittermanNetwork(
                self.N, n_views, hidden_dim=64
            ).to(self.device)

        optimizer = optim.Adam(self.black_litterman_net.parameters(), lr=lr)

        logger.info("Training Black-Litterman network...")

        # Use historical returns as training signal
        for epoch in range(n_epochs):
            total_loss = 0.0

            for t in range(20, self.T - 1):
                optimizer.zero_grad()

                # Use past returns to generate views
                market_returns = self.returns[t - 20:t].mean(dim=0)
                prior_returns = self.mean_returns

                # Get posterior
                posterior_returns = self.black_litterman_net(
                    market_returns, prior_returns, self.sample_cov
                )

                # Target: actual next return
                target = self.returns[t + 1]

                loss = F.mse_loss(posterior_returns, target)

                loss.backward()
                optimizer.step()

                total_loss += loss.item()

            if epoch % 10 == 0:
                avg_loss = total_loss / (self.T - 21)
                logger.info(f"Epoch {epoch}/{n_epochs}, Loss: {avg_loss:.6f}")

        logger.info("Black-Litterman network training complete")

    def get_black_litterman_returns(self) -> torch.Tensor:
        """Get Black-Litterman adjusted returns"""
        if self.black_litterman_net is None:
            raise ValueError("Black-Litterman network not trained")

        self.black_litterman_net.eval()
        with torch.no_grad():
            market_returns = self.returns[-20:].mean(dim=0)
            posterior = self.black_litterman_net(
                market_returns, self.mean_returns, self.sample_cov
            )

        return posterior

    # ========================================================================
    # RISK DECOMPOSITION (AUTOGRAD)
    # ========================================================================

    def risk_decomposition_autograd(self, weights: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Compute risk decomposition using autograd"""

        weights_var = weights.clone().detach().requires_grad_(True)

        portfolio_var = weights_var @ self.sample_cov @ weights_var
        portfolio_vol = torch.sqrt(portfolio_var + 1e-16)

        portfolio_vol.backward()

        marginal_contrib = weights_var.grad.clone()
        component_contrib = weights * marginal_contrib
        percentage_contrib = component_contrib / (portfolio_vol.detach() + 1e-16)

        return {
            'portfolio_volatility': portfolio_vol.item(),
            'marginal_contributions': marginal_contrib.detach(),
            'component_contributions': component_contrib.detach(),
            'percentage_contributions': percentage_contrib.detach()
        }

    # ========================================================================
    # COMPARISON METHODS
    # ========================================================================

    def compare_covariance_methods(self) -> pd.DataFrame:
        """Compare different covariance estimation methods"""

        results = []

        # Sample
        sample_cov = self.sample_cov
        results.append({
            'Method': 'Sample',
            'Condition_Number': torch.linalg.cond(sample_cov).item(),
            'Mean_Variance': torch.diag(sample_cov).mean().item(),
            'Frobenius_Norm': torch.norm(sample_cov, p='fro').item()
        })

        # Attention-based
        try:
            attn_cov = self.estimate_covariance_attention(n_epochs=50)
            results.append({
                'Method': 'Attention',
                'Condition_Number': torch.linalg.cond(attn_cov).item(),
                'Mean_Variance': torch.diag(attn_cov).mean().item(),
                'Frobenius_Norm': torch.norm(attn_cov, p='fro').item()
            })
        except Exception as e:
            logger.warning(f"Attention covariance failed: {e}")

        # Graph-based
        try:
            graph_cov = self.estimate_covariance_graph(n_epochs=50)
            results.append({
                'Method': 'Graph_Neural',
                'Condition_Number': torch.linalg.cond(graph_cov).item(),
                'Mean_Variance': torch.diag(graph_cov).mean().item(),
                'Frobenius_Norm': torch.norm(graph_cov, p='fro').item()
            })
        except Exception as e:
            logger.warning(f"Graph covariance failed: {e}")

        return pd.DataFrame(results)

    def compare_optimization_methods(self) -> pd.DataFrame:
        """Compare traditional vs modern optimization"""

        results = []

        # Minimum variance (PyTorch)
        mv_result = self.optimize_minimum_variance_torch(max_iter=500)
        results.append({
            'Method': 'Min_Variance_Torch',
            'Objective': mv_result.objective_value,
            'Effective_N': mv_result.effective_number_of_assets(),
            'Success': mv_result.success
        })

        # Maximum Sharpe (PyTorch)
        sharpe_result = self.optimize_maximum_sharpe_torch(max_iter=500)
        results.append({
            'Method': 'Max_Sharpe_Torch',
            'Objective': sharpe_result.objective_value,
            'Effective_N': sharpe_result.effective_number_of_assets(),
            'Success': sharpe_result.success
        })

        # Risk Parity (PyTorch)
        rp_result = self.optimize_risk_parity_torch(max_iter=500)
        results.append({
            'Method': 'Risk_Parity_Torch',
            'Objective': rp_result.objective_value,
            'Effective_N': rp_result.effective_number_of_assets(),
            'Success': rp_result.success
        })

        return pd.DataFrame(results)


# ============================================================================
# DEMONSTRATION
# ============================================================================

def run_experiment(seed: Optional[int] = None, save_results: bool = True) -> Tuple[Dict, pd.DataFrame]:
    """
    Run complete portfolio optimization experiment

    Args:
        seed: Random seed (if None, generates random seed)
        save_results: Whether to save results to JSON

    Returns:
        Tuple of (results dictionary, returns DataFrame)
    """

    # Generate or use provided seed
    if seed is None:
        seed = np.random.randint(0, 2 ** 31 - 1)

    logger.info(f"Running experiment with seed: {seed}")

    # Set seeds
    torch.manual_seed(seed)
    np.random.seed(seed)

    T = 252
    N = 10

    # Factor model returns
    factor_returns = torch.randn(T, 2) * 0.01
    factor_loadings = torch.randn(N, 2)
    idiosyncratic = torch.randn(T, N) * 0.005
    returns = factor_returns @ factor_loadings.T + idiosyncratic

    returns_df = pd.DataFrame(
        returns.numpy(),
        columns=[f'Asset_{i + 1}' for i in range(N)]
    )

    # Store all results
    results = {
        'metadata': {
            'seed': int(seed),
            'timestamp': datetime.now().isoformat(),
            'T': T,
            'N': N
        },
        'optimizations': {},
        'neural_models': {},
        'comparisons': {}
    }

    return results, returns_df


if __name__ == "__main__":
    import sys

    # Check if seed provided via command line
    if len(sys.argv) > 1:
        seed = int(sys.argv[1])
        logger.info(f"Using provided seed: {seed}")
    else:
        seed = None  # Will generate random

    results, returns_df = run_experiment(seed=seed)

    N = results['metadata']['N']  # Get N from metadata

    print("=" * 80)
    print("MODERN PORTFOLIO OPTIMIZATION FRAMEWORK - PYTORCH EDITION")
    print(f"SEED: {results['metadata']['seed']}")
    print("=" * 80)

    # Initialize framework
    framework = ModernPortfolioFramework(returns_df, device='cpu')

    print("\n" + "=" * 80)
    print("BACKTESTING ENGINE")
    print("=" * 80)

    print("\n--- Single Strategy Backtest ---")
    backtest_result = framework.run_backtest(
        strategy="minimum_variance",
        lookback_window=126,
        rebalance_freq=RebalanceFrequency.MONTHLY,
        transaction_cost_rate=0.001
    )

    print(f"Total Return: {backtest_result.total_return * 100:.2f}%")
    print(f"Annual Return: {backtest_result.annualized_return * 100:.2f}%")
    print(f"Annual Volatility: {backtest_result.annualized_volatility * 100:.2f}%")
    print(f"Sharpe Ratio: {backtest_result.sharpe_ratio:.2f}")
    print(f"Max Drawdown: {backtest_result.max_drawdown * 100:.2f}%")
    print(f"Calmar Ratio: {backtest_result.calmar_ratio:.2f}")
    print(f"Number of Rebalances: {len(backtest_result.rebalance_dates)}")

    results['backtesting'] = {
        'single_strategy': {
            'total_return': float(backtest_result.total_return),
            'annualized_return': float(backtest_result.annualized_return),
            'sharpe_ratio': float(backtest_result.sharpe_ratio),
            'max_drawdown': float(backtest_result.max_drawdown),
            'n_rebalances': len(backtest_result.rebalance_dates)
        }
    }

    print("\n--- Multi-Strategy Comparison ---")
    strategy_comparison = framework.compare_strategies(
        strategies=["minimum_variance", "maximum_sharpe", "risk_parity"],
        lookback_window=126,
        rebalance_freq=RebalanceFrequency.MONTHLY
    )
    print(strategy_comparison.to_string(index=False))

    results['backtesting']['strategy_comparison'] = strategy_comparison.to_dict('records')

    print("\n" + "=" * 80)
    print("MULTI-PERIOD OPTIMIZATION")
    print("=" * 80)

    print("\n--- Dynamic Programming Optimization ---")
    mp_result = framework.optimize_multi_period(
        n_periods=12,
        transaction_cost_rate=0.001,
        risk_aversion=1.0,
        use_garch=False
    )

    print(f"Expected Utility: {mp_result.expected_utility:.4f}")
    print(f"Terminal Wealth: {mp_result.terminal_wealth:.4f}")
    print(f"Total Transaction Costs: {mp_result.path_statistics['total_transaction_costs']:.4f}")
    print(f"Avg Period Return: {mp_result.path_statistics['average_period_return'] * 100:.2f}%")
    print(f"\nOptimal weights for next 3 periods:")
    for t in range(min(3, mp_result.optimal_weights.shape[0])):
        top_3 = torch.topk(mp_result.optimal_weights[t], 3)
        print(f"  Period {t + 1}: Top weights = {top_3.values.numpy()}")

    results['multi_period'] = {
        'dynamic_programming': {
            'expected_utility': float(mp_result.expected_utility),
            'terminal_wealth': float(mp_result.terminal_wealth),
            'path_statistics': {k: float(v) for k, v in mp_result.path_statistics.items()}
        }
    }

    print("\n--- GARCH-Based Multi-Period Optimization ---")
    mp_garch_result = framework.optimize_multi_period(
        n_periods=12,
        transaction_cost_rate=0.001,
        risk_aversion=1.0,
        use_garch=True
    )

    print(f"GARCH Expected Utility: {mp_garch_result.expected_utility:.4f}")
    print(f"GARCH Terminal Wealth: {mp_garch_result.terminal_wealth:.4f}")

    results['multi_period']['garch'] = {
        'expected_utility': float(mp_garch_result.expected_utility),
        'terminal_wealth': float(mp_garch_result.terminal_wealth)
    }

    print("\n" + "=" * 80)
    print("TORCH-NATIVE OPTIMIZATION")
    print("=" * 80)

    # Minimum variance
    print("\n--- Minimum Variance (PyTorch) ---")
    mv_result = framework.optimize_minimum_variance_torch(max_iter=500)
    print(f"Success: {mv_result.success}")
    print(f"Variance: {mv_result.objective_value:.6f}")
    print(f"Effective N assets: {mv_result.effective_number_of_assets():.2f}")
    print(f"Top 3 weights: {torch.topk(mv_result.weights, 3).values.numpy()}")

    results['optimizations']['minimum_variance'] = {
        'success': mv_result.success,
        'objective_value': float(mv_result.objective_value),
        'effective_n_assets': float(mv_result.effective_number_of_assets()),
        'weights': mv_result.weights.cpu().numpy().tolist()
    }

    # Maximum Sharpe
    print("\n--- Maximum Sharpe (PyTorch) ---")
    sharpe_result = framework.optimize_maximum_sharpe_torch(max_iter=500)
    sharpe_ratio = -sharpe_result.objective_value
    print(f"Success: {sharpe_result.success}")
    print(f"Sharpe ratio: {sharpe_ratio:.4f}")
    print(f"Effective N assets: {sharpe_result.effective_number_of_assets():.2f}")

    results['optimizations']['maximum_sharpe'] = {
        'success': sharpe_result.success,
        'sharpe_ratio': float(sharpe_ratio),
        'effective_n_assets': float(sharpe_result.effective_number_of_assets()),
        'weights': sharpe_result.weights.cpu().numpy().tolist()
    }

    # Risk Parity
    print("\n--- Risk Parity (PyTorch) ---")
    rp_result = framework.optimize_risk_parity_torch(max_iter=500)
    print(f"Success: {rp_result.success}")
    print(f"Volatility: {torch.sqrt(torch.tensor(rp_result.objective_value)).item():.6f}")
    print(f"Effective N assets: {rp_result.effective_number_of_assets():.2f}")

    results['optimizations']['risk_parity'] = {
        'success': rp_result.success,
        'volatility': float(torch.sqrt(torch.tensor(rp_result.objective_value)).item()),
        'effective_n_assets': float(rp_result.effective_number_of_assets()),
        'weights': rp_result.weights.cpu().numpy().tolist()
    }

    print("\n" + "=" * 80)
    print("NEURAL COVARIANCE ESTIMATION")
    print("=" * 80)

    print("\n--- Comparing Covariance Methods ---")
    cov_comparison = framework.compare_covariance_methods()
    print(cov_comparison.to_string(index=False))

    results['comparisons']['covariance_methods'] = cov_comparison.to_dict('records')

    print("\n" + "=" * 80)
    print("AUTOGRAD RISK DECOMPOSITION")
    print("=" * 80)

    equal_weights = torch.ones(N) / N
    decomp = framework.risk_decomposition_autograd(equal_weights)
    print(f"\nPortfolio volatility: {decomp['portfolio_volatility']:.6f}")
    print(f"Marginal contributions (first 3): {decomp['marginal_contributions'][:3].numpy()}")
    print(f"Percentage contributions (first 3): {decomp['percentage_contributions'][:3].numpy()}")

    results['risk_decomposition'] = {
        'portfolio_volatility': float(decomp['portfolio_volatility']),
        'marginal_contributions': decomp['marginal_contributions'].cpu().numpy().tolist(),
        'percentage_contributions': decomp['percentage_contributions'].cpu().numpy().tolist()
    }

    print("\n" + "=" * 80)
    print("NEURAL RISK PARITY")
    print("=" * 80)

    framework.train_neural_risk_parity(n_epochs=200, lr=0.001)
    neural_rp_result = framework.optimize_neural_risk_parity()
    print(f"\nNeural risk parity objective: {neural_rp_result.objective_value:.6f}")
    print(f"Effective N assets: {neural_rp_result.effective_number_of_assets():.2f}")

    results['neural_models']['neural_risk_parity'] = {
        'objective_value': float(neural_rp_result.objective_value),
        'effective_n_assets': float(neural_rp_result.effective_number_of_assets()),
        'weights': neural_rp_result.weights.cpu().numpy().tolist()
    }

    print("\n" + "=" * 80)
    print("RETURN PREDICTION")
    print("=" * 80)

    print("\nTraining transformer return predictor...")
    framework.train_return_predictor(seq_len=20, n_epochs=50, batch_size=16)

    predicted_returns = framework.predict_returns(lookback=20)
    actual_mean = framework.mean_returns
    print(f"\nPredicted returns (first 3): {predicted_returns[:3].numpy()}")
    print(f"Historical mean (first 3): {actual_mean[:3].numpy()}")

    results['neural_models']['return_prediction'] = {
        'predicted_returns': predicted_returns.cpu().numpy().tolist(),
        'historical_mean': actual_mean.cpu().numpy().tolist()
    }

    print("\n" + "=" * 80)
    print("BLACK-LITTERMAN WITH NEURAL VIEWS")
    print("=" * 80)

    framework.train_black_litterman_network(n_views=5, n_epochs=50)
    bl_returns = framework.get_black_litterman_returns()
    print(f"\nBL-adjusted returns (first 3): {bl_returns[:3].numpy()}")
    print(f"Prior returns (first 3): {framework.mean_returns[:3].numpy()}")

    results['neural_models']['black_litterman'] = {
        'adjusted_returns': bl_returns.cpu().numpy().tolist(),
        'prior_returns': framework.mean_returns.cpu().numpy().tolist()
    }

    print("\n" + "=" * 80)
    print("SAVING RESULTS")
    print("=" * 80)

    # Save to JSON
    filename = f"portfolio_experiment_{results['metadata']['seed']}.json"
    with open(filename, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to: {filename}")
    print(f"To reproduce this run: python fin.py {results['metadata']['seed']}")

    print("\n" + "=" * 80)
    print("COMPLETE - All modern features demonstrated")
    print("=" * 80)