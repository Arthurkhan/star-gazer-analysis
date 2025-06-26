import { BusinessType } from '@/types/businessTypes'
import type { BusinessTypePrompts} from '@/types/aiService'
import { PromptTemplate } from '@/types/aiService'

export const businessPrompts: Record<BusinessType, BusinessTypePrompts> = {
  [BusinessType.CAFE]: {
    analysis: {
      system: 'You are an expert cafe business analyst. Analyze customer reviews to identify specific insights about coffee quality, food offerings, atmosphere, service, and pricing.',
      user: `Analyze these cafe reviews and provide insights:
        
        Reviews: {{reviews}}
        
        Focus on:
        1. Coffee quality and variety
        2. Food menu and quality
        3. Atmosphere and ambiance
        4. Service speed and friendliness
        5. Pricing and value perception
        6. Cleanliness and comfort
        7. WiFi and workspace suitability
        
        Provide structured analysis with specific examples from reviews.`,
      variables: ['reviews'],
    },
    recommendations: {
      system: 'You are a cafe business strategist. Generate specific, actionable recommendations based on customer feedback.',
      user: `Based on this analysis, generate personalized recommendations for {{businessName}}:
        
        Current Analysis: {{analysis}}
        Business Type: Cafe
        Metrics: {{metrics}}
        
        Generate recommendations for:
        1. Menu optimization
        2. Service improvements
        3. Atmosphere enhancements
        4. Marketing strategies
        5. Customer retention
        6. Revenue growth opportunities
        
        Be specific and actionable, avoiding generic advice.`,
      variables: ['businessName', 'analysis', 'metrics'],
    },
    marketing: {
      system: 'You are a marketing expert specializing in cafes. Create targeted marketing strategies.',
      user: `Create a marketing plan for {{businessName}} based on:
        
        Customer Analysis: {{analysis}}
        Strengths: {{strengths}}
        Target Demographics: {{demographics}}
        
        Include:
        1. Unique value proposition
        2. Target audience segments
        3. Marketing channels (social media, local, etc.)
        4. Campaign ideas
        5. Budget allocation
        6. Success metrics`,
      variables: ['businessName', 'analysis', 'strengths', 'demographics'],
    },
    scenarios: {
      system: 'You are a business scenario planner. Create realistic growth scenarios for cafes.',
      user: `Generate business scenarios for {{businessName}}:
        
        Current State: {{currentMetrics}}
        Market Trends: {{trends}}
        Recommendations: {{recommendations}}
        
        Create 3-4 scenarios with:
        1. Scenario name and description
        2. Required actions
        3. Probability of success
        4. Expected outcomes
        5. Key metrics projections`,
      variables: ['businessName', 'currentMetrics', 'trends', 'recommendations'],
    },
  },

  [BusinessType.BAR]: {
    analysis: {
      system: 'You are an expert bar business analyst. Analyze customer reviews focusing on drinks, atmosphere, entertainment, and nightlife experience.',
      user: `Analyze these bar reviews:
        
        Reviews: {{reviews}}
        
        Focus on:
        1. Drink quality and variety
        2. Bartender skills and service
        3. Atmosphere and ambiance
        4. Music and entertainment
        5. Crowd and clientele
        6. Pricing and value
        7. Safety and comfort
        
        Identify patterns and provide specific insights.`,
      variables: ['reviews'],
    },
    recommendations: {
      system: 'You are a bar business consultant. Provide strategies for improving bar operations and customer experience.',
      user: `Generate recommendations for {{businessName}}:
        
        Analysis: {{analysis}}
        Business Type: Bar
        Current Performance: {{metrics}}
        
        Focus on:
        1. Drink menu optimization
        2. Entertainment programming
        3. Atmosphere improvements
        4. Staff training needs
        5. Marketing to target demographics
        6. Revenue optimization strategies`,
      variables: ['businessName', 'analysis', 'metrics'],
    },
    marketing: {
      system: 'You are a nightlife marketing specialist. Create engaging marketing strategies for bars.',
      user: `Develop a marketing strategy for {{businessName}}:
        
        Analysis: {{analysis}}
        Target Market: {{demographics}}
        Competitive Position: {{position}}
        
        Include:
        1. Brand positioning
        2. Event marketing ideas
        3. Social media strategy
        4. Partnership opportunities
        5. Promotional campaigns
        6. Customer loyalty programs`,
      variables: ['businessName', 'analysis', 'demographics', 'position'],
    },
    scenarios: {
      system: 'Create business growth scenarios for bars considering seasonal trends and nightlife dynamics.',
      user: `Generate scenarios for {{businessName}}:
        
        Current State: {{currentMetrics}}
        Industry Trends: {{trends}}
        Opportunities: {{opportunities}}
        
        Develop scenarios including:
        1. Event-driven growth
        2. Demographic expansion
        3. Service diversification
        4. Partnership strategies`,
      variables: ['businessName', 'currentMetrics', 'trends', 'opportunities'],
    },
  },

  [BusinessType.RESTAURANT]: {
    analysis: {
      system: 'You are a restaurant industry expert. Analyze reviews for comprehensive insights on food, service, and dining experience.',
      user: `Analyze restaurant reviews:
        
        Reviews: {{reviews}}
        
        Examine:
        1. Food quality and presentation
        2. Menu variety and dietary options
        3. Service quality and speed
        4. Ambiance and cleanliness
        5. Value for money
        6. Reservation and wait times
        7. Special occasions suitability
        
        Provide detailed insights with examples.`,
      variables: ['reviews'],
    },
    recommendations: {
      system: 'You are a restaurant consultant. Provide comprehensive improvement strategies.',
      user: `Create recommendations for {{businessName}}:
        
        Analysis: {{analysis}}
        Type: Restaurant
        Performance: {{metrics}}
        
        Address:
        1. Menu engineering
        2. Service training programs
        3. Kitchen efficiency
        4. Customer experience enhancement
        5. Pricing optimization
        6. Marketing strategies`,
      variables: ['businessName', 'analysis', 'metrics'],
    },
    marketing: {
      system: 'You are a restaurant marketing expert. Design effective marketing campaigns.',
      user: `Design marketing plan for {{businessName}}:
        
        Insights: {{analysis}}
        Strengths: {{strengths}}
        Target Market: {{demographics}}
        
        Create:
        1. Brand story and positioning
        2. Digital marketing strategy
        3. Local community engagement
        4. Seasonal promotions
        5. Loyalty programs
        6. Review generation tactics`,
      variables: ['businessName', 'analysis', 'strengths', 'demographics'],
    },
    scenarios: {
      system: 'Create realistic growth scenarios for restaurants.',
      user: `Develop scenarios for {{businessName}}:
        
        Current: {{currentMetrics}}
        Market: {{trends}}
        Potential: {{opportunities}}
        
        Include:
        1. Expansion scenarios
        2. Menu evolution paths
        3. Service model changes
        4. Technology adoption`,
      variables: ['businessName', 'currentMetrics', 'trends', 'opportunities'],
    },
  },

  [BusinessType.GALLERY]: {
    analysis: {
      system: 'You are an art gallery specialist. Analyze reviews focusing on exhibitions, curation, and visitor experience.',
      user: `Analyze gallery reviews:
        
        Reviews: {{reviews}}
        
        Focus on:
        1. Exhibition quality and curation
        2. Artist selection and diversity
        3. Gallery space and layout
        4. Staff knowledge and guidance
        5. Pricing and accessibility
        6. Events and programs
        7. Overall visitor experience
        
        Extract specific insights about art appreciation and cultural impact.`,
      variables: ['reviews'],
    },
    recommendations: {
      system: 'You are a gallery consultant. Provide strategies for enhancing cultural impact and visitor engagement.',
      user: `Generate recommendations for {{businessName}}:
        
        Analysis: {{analysis}}
        Type: Art Gallery
        Metrics: {{metrics}}
        
        Suggest improvements for:
        1. Curatorial strategy
        2. Visitor engagement programs
        3. Artist relations
        4. Educational initiatives
        5. Digital presence
        6. Revenue diversification`,
      variables: ['businessName', 'analysis', 'metrics'],
    },
    marketing: {
      system: 'You are an arts marketing specialist. Create culturally relevant marketing strategies.',
      user: `Create marketing strategy for {{businessName}}:
        
        Analysis: {{analysis}}
        Audience: {{demographics}}
        Cultural Position: {{position}}
        
        Develop:
        1. Art community engagement
        2. Digital exhibition strategies
        3. Educational outreach
        4. Membership programs
        5. Event marketing
        6. Partnership opportunities`,
      variables: ['businessName', 'analysis', 'demographics', 'position'],
    },
    scenarios: {
      system: 'Create growth scenarios for art galleries considering cultural trends.',
      user: `Generate scenarios for {{businessName}}:
        
        Current: {{currentMetrics}}
        Art Market Trends: {{trends}}
        Opportunities: {{opportunities}}
        
        Consider:
        1. Digital transformation
        2. Community partnerships
        3. Educational expansion
        4. International reach`,
      variables: ['businessName', 'currentMetrics', 'trends', 'opportunities'],
    },
  },

  [BusinessType.RETAIL]: {
    analysis: {
      system: 'You are a retail business analyst. Focus on product selection, customer service, and shopping experience.',
      user: `Analyze retail reviews:
        
        Reviews: {{reviews}}
        
        Examine:
        1. Product quality and selection
        2. Pricing and value
        3. Customer service quality
        4. Store layout and organization
        5. Checkout experience
        6. Return policy and support
        7. Online/offline integration
        
        Identify retail-specific patterns.`,
      variables: ['reviews'],
    },
    recommendations: {
      system: 'You are a retail consultant. Provide strategies for improving sales and customer satisfaction.',
      user: `Create recommendations for {{businessName}}:
        
        Analysis: {{analysis}}
        Type: Retail
        Performance: {{metrics}}
        
        Focus on:
        1. Inventory optimization
        2. Customer service training
        3. Store layout improvements
        4. Pricing strategies
        5. Omnichannel experience
        6. Loyalty programs`,
      variables: ['businessName', 'analysis', 'metrics'],
    },
    marketing: {
      system: 'You are a retail marketing expert. Design customer acquisition and retention strategies.',
      user: `Develop marketing for {{businessName}}:
        
        Insights: {{analysis}}
        Target Customers: {{demographics}}
        Competition: {{position}}
        
        Include:
        1. Product promotion strategies
        2. Seasonal campaigns
        3. Digital marketing tactics
        4. In-store experiences
        5. Customer retention programs
        6. Community engagement`,
      variables: ['businessName', 'analysis', 'demographics', 'position'],
    },
    scenarios: {
      system: 'Create retail growth scenarios considering market trends.',
      user: `Generate scenarios for {{businessName}}:
        
        Current: {{currentMetrics}}
        Retail Trends: {{trends}}
        Opportunities: {{opportunities}}
        
        Consider:
        1. E-commerce integration
        2. Product line expansion
        3. New market entry
        4. Franchise opportunities`,
      variables: ['businessName', 'currentMetrics', 'trends', 'opportunities'],
    },
  },

  [BusinessType.SERVICE]: {
    analysis: {
      system: 'You are a service industry analyst. Focus on service quality, expertise, and customer satisfaction.',
      user: `Analyze service business reviews:
        
        Reviews: {{reviews}}
        
        Evaluate:
        1. Service quality and expertise
        2. Professionalism and reliability
        3. Communication and responsiveness
        4. Pricing transparency
        5. Problem resolution
        6. Appointment/scheduling experience
        7. Overall value delivered
        
        Extract service-specific insights.`,
      variables: ['reviews'],
    },
    recommendations: {
      system: 'You are a service business consultant. Provide operational excellence strategies.',
      user: `Generate recommendations for {{businessName}}:
        
        Analysis: {{analysis}}
        Type: Service Business
        Metrics: {{metrics}}
        
        Improve:
        1. Service delivery processes
        2. Staff training and expertise
        3. Customer communication
        4. Pricing and packages
        5. Scheduling efficiency
        6. Quality assurance`,
      variables: ['businessName', 'analysis', 'metrics'],
    },
    marketing: {
      system: 'You are a service marketing specialist. Create trust-building marketing strategies.',
      user: `Create marketing for {{businessName}}:
        
        Analysis: {{analysis}}
        Target Market: {{demographics}}
        Expertise: {{strengths}}
        
        Develop:
        1. Trust-building content
        2. Referral programs
        3. Case studies and testimonials
        4. Professional networking
        5. Digital presence optimization
        6. Educational marketing`,
      variables: ['businessName', 'analysis', 'demographics', 'strengths'],
    },
    scenarios: {
      system: 'Create service business growth scenarios.',
      user: `Generate scenarios for {{businessName}}:
        
        Current: {{currentMetrics}}
        Industry Trends: {{trends}}
        Growth Potential: {{opportunities}}
        
        Include:
        1. Service expansion
        2. Geographic growth
        3. Partnership models
        4. Digital transformation`,
      variables: ['businessName', 'currentMetrics', 'trends', 'opportunities'],
    },
  },

  [BusinessType.OTHER]: {
    analysis: {
      system: 'You are a general business analyst. Provide comprehensive review analysis.',
      user: `Analyze business reviews:
        
        Reviews: {{reviews}}
        
        Focus on:
        1. Overall customer satisfaction
        2. Product/service quality
        3. Staff performance
        4. Value proposition
        5. Customer experience
        6. Operational efficiency
        7. Competitive advantages
        
        Provide detailed insights.`,
      variables: ['reviews'],
    },
    recommendations: {
      system: 'You are a business consultant. Provide general improvement strategies.',
      user: `Create recommendations for {{businessName}}:
        
        Analysis: {{analysis}}
        Metrics: {{metrics}}
        
        Address:
        1. Core service improvements
        2. Customer experience enhancement
        3. Operational efficiency
        4. Staff development
        5. Marketing strategies
        6. Growth opportunities`,
      variables: ['businessName', 'analysis', 'metrics'],
    },
    marketing: {
      system: 'You are a marketing strategist. Create versatile marketing plans.',
      user: `Develop marketing for {{businessName}}:
        
        Analysis: {{analysis}}
        Target Market: {{demographics}}
        Strengths: {{strengths}}
        
        Create:
        1. Brand positioning
        2. Marketing channels
        3. Customer acquisition
        4. Retention strategies
        5. Content marketing
        6. Performance metrics`,
      variables: ['businessName', 'analysis', 'demographics', 'strengths'],
    },
    scenarios: {
      system: 'Create business growth scenarios.',
      user: `Generate scenarios for {{businessName}}:
        
        Current: {{currentMetrics}}
        Trends: {{trends}}
        Opportunities: {{opportunities}}
        
        Develop:
        1. Growth scenarios
        2. Market expansion
        3. Service evolution
        4. Risk mitigation`,
      variables: ['businessName', 'currentMetrics', 'trends', 'opportunities'],
    },
  },
}

export function getPromptsForBusinessType(businessType: BusinessType): BusinessTypePrompts {
  return businessPrompts[businessType] || businessPrompts[BusinessType.OTHER]
}
