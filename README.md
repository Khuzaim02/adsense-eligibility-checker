# AdSense Eligibility Checker

A web application that helps website owners check if their website meets Google AdSense requirements and provides detailed recommendations for improvement.

## Features

- Website analysis for AdSense eligibility
- Detailed SEO recommendations
- Performance and accessibility checks
- Real-time progress updates
- Comprehensive guide for AdSense approval
- Mobile-responsive design

## Tech Stack

- Frontend: React.js with Tailwind CSS
- Backend: Node.js with Express
- Real-time updates: Server-Sent Events (SSE)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Khuzaim02/adsense-eligibility-checker.git
cd adsense-eligibility-checker
```

2. Install dependencies:
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
```

3. Start the development servers:
```bash
# Start the backend server (from root directory)
npm run dev

# Start the frontend server (from client directory)
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Usage

1. Open your web browser and navigate to http://localhost:3000
2. Enter the website URL you want to analyze
3. Click "Analyze Website"
4. Wait for the analysis to complete
5. Review the detailed results and recommendations

## Analysis Criteria

The tool checks for:

- SEO Elements
  - Title tag
  - Meta description
  - H1 tags
  - Image optimization
  - Internal linking

- Required Pages
  - Privacy Policy
  - Contact Page
  - About Page

- Technical Requirements
  - HTTPS implementation
  - Mobile responsiveness
  - Page load speed

- Content Quality
  - Word count
  - Content uniqueness
  - Paragraph structure

- Domain Factors
  - Domain age
  - Domain authority

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool provides an estimate of AdSense eligibility based on common factors. The final decision for AdSense approval rests with Google and may depend on additional factors not covered by this tool. 