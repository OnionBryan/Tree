import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * GSU Store Context
 * Manages GSU-specific data: participants, matrices, knowledge graphs, surveys
 */

const GSUContext = createContext(null);

export const useGSUStore = () => {
  const context = useContext(GSUContext);
  if (!context) {
    throw new Error('useGSUStore must be used within GSUProvider');
  }
  return context;
};

export const GSUProvider = ({ children }) => {
  const [participants, setParticipants] = useState([]);
  const [relationshipMatrix, setRelationshipMatrix] = useState(null);
  const [knowledgeGraphs, setKnowledgeGraphs] = useState([]);
  const [surveyQuestions, setSurveyQuestions] = useState([]);
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [mlModels, setMlModels] = useState([]);
  const [activeExperiment, setActiveExperiment] = useState(null);

  // Add participant
  const addParticipant = useCallback((participant) => {
    setParticipants(prev => [...prev, {
      id: participant.id || `p_${Date.now()}`,
      name: participant.name,
      ...participant
    }]);
  }, []);

  // Remove participant
  const removeParticipant = useCallback((participantId) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  }, []);

  // Update participant
  const updateParticipant = useCallback((participantId, updates) => {
    setParticipants(prev => prev.map(p =>
      p.id === participantId ? { ...p, ...updates } : p
    ));
  }, []);

  // Set relationship matrix
  const updateRelationshipMatrix = useCallback((matrix) => {
    setRelationshipMatrix(matrix);
  }, []);

  // Add knowledge graph
  const addKnowledgeGraph = useCallback((graph) => {
    setKnowledgeGraphs(prev => [...prev, {
      id: graph.id || `kg_${Date.now()}`,
      name: graph.name,
      createdAt: new Date().toISOString(),
      ...graph
    }]);
  }, []);

  // Remove knowledge graph
  const removeKnowledgeGraph = useCallback((graphId) => {
    setKnowledgeGraphs(prev => prev.filter(kg => kg.id !== graphId));
  }, []);

  // Add survey question
  const addSurveyQuestion = useCallback((question) => {
    setSurveyQuestions(prev => [...prev, {
      id: question.id || `q_${Date.now()}`,
      ...question
    }]);
  }, []);

  // Remove survey question
  const removeSurveyQuestion = useCallback((questionId) => {
    setSurveyQuestions(prev => prev.filter(q => q.id !== questionId));
  }, []);

  // Update survey question
  const updateSurveyQuestion = useCallback((questionId, updates) => {
    setSurveyQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    ));
  }, []);

  // Add survey response
  const addSurveyResponse = useCallback((response) => {
    setSurveyResponses(prev => [...prev, {
      id: response.id || `r_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...response
    }]);
  }, []);

  // Add ML model
  const addMLModel = useCallback((model) => {
    setMlModels(prev => [...prev, {
      id: model.id || `ml_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...model
    }]);
  }, []);

  // Export all GSU data
  const exportGSUData = useCallback(() => {
    return {
      participants,
      relationshipMatrix,
      knowledgeGraphs,
      surveyQuestions,
      surveyResponses,
      mlModels,
      activeExperiment,
      exportedAt: new Date().toISOString()
    };
  }, [participants, relationshipMatrix, knowledgeGraphs, surveyQuestions, surveyResponses, mlModels, activeExperiment]);

  // Import GSU data
  const importGSUData = useCallback((data) => {
    if (data.participants) setParticipants(data.participants);
    if (data.relationshipMatrix) setRelationshipMatrix(data.relationshipMatrix);
    if (data.knowledgeGraphs) setKnowledgeGraphs(data.knowledgeGraphs);
    if (data.surveyQuestions) setSurveyQuestions(data.surveyQuestions);
    if (data.surveyResponses) setSurveyResponses(data.surveyResponses);
    if (data.mlModels) setMlModels(data.mlModels);
    if (data.activeExperiment) setActiveExperiment(data.activeExperiment);
    console.log('[GSUStore] Imported GSU data');
  }, []);

  // Clear all data
  const clearAllData = useCallback(() => {
    setParticipants([]);
    setRelationshipMatrix(null);
    setKnowledgeGraphs([]);
    setSurveyQuestions([]);
    setSurveyResponses([]);
    setMlModels([]);
    setActiveExperiment(null);
    console.log('[GSUStore] Cleared all GSU data');
  }, []);

  const value = {
    // State
    participants,
    relationshipMatrix,
    knowledgeGraphs,
    surveyQuestions,
    surveyResponses,
    mlModels,
    activeExperiment,

    // Setters
    setParticipants,
    setRelationshipMatrix,
    setKnowledgeGraphs,
    setSurveyQuestions,
    setSurveyResponses,
    setMlModels,
    setActiveExperiment,

    // Actions
    addParticipant,
    removeParticipant,
    updateParticipant,
    updateRelationshipMatrix,
    addKnowledgeGraph,
    removeKnowledgeGraph,
    addSurveyQuestion,
    removeSurveyQuestion,
    updateSurveyQuestion,
    addSurveyResponse,
    addMLModel,
    exportGSUData,
    importGSUData,
    clearAllData
  };

  return (
    <GSUContext.Provider value={value}>
      {children}
    </GSUContext.Provider>
  );
};
