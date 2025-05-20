import React from 'react';
import './styles.css';

// Fix for RecommendationsDashboard.tsx
// Add unique key prop to each list item
export const RecommendationsDashboard = ({ recommendations = [] }) => {
  return (
    <div className="recommendations-container">
      {recommendations.map((recommendation) => (
        <div key={recommendation.id || `rec-${Math.random()}`} className="recommendation-card">
          <h3>{recommendation.title}</h3>
          <p>{recommendation.description}</p>
          <span className="category-tag">{recommendation.category}</span>
        </div>
      ))}
    </div>
  );
};

export default RecommendationsDashboard;