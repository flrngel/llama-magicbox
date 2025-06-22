# Rating System Operation Policy

## Overview
The MagicBox rating system allows users to provide feedback on AI solutions after successful document processing, helping maintain quality and guide other users in solution selection.

## Rating Criteria

### Star Rating (1-5 stars)
- **5 Stars**: Excellent - Perfect results, extracted exactly what was needed
- **4 Stars**: Good - Minor issues but mostly accurate results
- **3 Stars**: Average - Decent results with some missing or incorrect data
- **2 Stars**: Poor - Significant issues, many errors or missing data
- **1 Star**: Terrible - Completely inaccurate or failed to extract useful information

### Comment Guidelines
- **Optional**: Users can provide written feedback (max 500 characters)
- **Constructive**: Focus on result quality, accuracy, and usefulness
- **Specific**: Mention what worked well or what could be improved
- **Professional**: Keep feedback respectful and solution-focused

## Rating Rules

### Eligibility
- Only users who successfully processed documents can rate
- One rating per user per solution (can update existing rating)
- Rating requires successful AI processing completion

### Rating Submission
- **Timing**: Appears after successful document processing
- **Persistence**: Ratings saved to database immediately
- **Updates**: Users can modify their rating within 24 hours
- **Anonymous**: Ratings are anonymous to solution creators

### Rating Display
- **Public Visibility**: Average rating and count shown on solution cards
- **Aggregation**: Real-time average calculation from all ratings
- **Minimum Threshold**: Need 3+ ratings before average is displayed
- **Creator Access**: Creators can see rating breakdown and comments

## Quality Control

### Spam Prevention
- Rate limiting: Max 10 ratings per user per day
- Duplicate detection: Prevent multiple ratings from same user/solution
- Content filtering: Basic profanity and spam detection for comments

### Rating Integrity
- **No Self-Rating**: Creators cannot rate their own solutions
- **Abuse Reporting**: Users can report inappropriate ratings
- **Moderation**: Admin review for flagged ratings

## Business Impact

### Solution Ranking
- Ratings influence search result ordering
- Higher-rated solutions get priority placement
- Minimum rating threshold for featured solutions

### Creator Incentives
- Rating feedback helps creators improve solutions
- High-rated solutions eligible for promotional features
- Poor ratings trigger improvement suggestions

## Data Storage

### Rating Records
```
{
  id: string,
  solutionId: string,
  userId: string,
  rating: number (1-5),
  comment?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Solution Rating Cache
- Average rating cached on solution record
- Rating count cached for performance
- Updates triggered by new ratings

## Implementation Notes
- Ratings appear after successful document processing
- Simple 5-star interface with optional comment
- Real-time rating average updates
- Mobile-responsive rating component