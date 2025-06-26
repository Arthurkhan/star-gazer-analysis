import React from 'react'
import './styles.css'

// Fix for GrowthStrategiesView.tsx
// Add null check for theme.colors
export const GrowthStrategiesView = ({ data, theme }) => {
  // Default color if theme or theme.colors.primary is undefined
  const primaryColor = theme && theme.colors && theme.colors.primary
    ? theme.colors.primary
    : '#4285F4' // Fallback color

  // Rest of your component code
  return (
    <div className="growth-strategies-view">
      <h2 style={{ color: primaryColor }}>Growth Strategies</h2>
      {/* Add your component content here */}
      <div className="strategies-list">
        {data && data.strategies ? (
          data.strategies.map((strategy, index) => (
            <div key={`strategy-${index}`} className="strategy-card">
              <h3>{strategy.title}</h3>
              <p>{strategy.description}</p>
            </div>
          ))
        ) : (
          <p>No growth strategies available.</p>
        )}
      </div>
    </div>
  )
}

export default GrowthStrategiesView
