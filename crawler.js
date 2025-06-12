const axios = require('axios');
const cheerio = require('cheerio');
const whois = require('whois');
const { promisify } = require('util');
const whoisLookup = promisify(whois.lookup);

async function analyzeWebsite(url, onProgress) {
  const totalSteps = 10;
  let currentStep = 0;

  const updateProgress = (step, message) => {
    currentStep = step;
    const progress = Math.round((step / totalSteps) * 100);
    if (onProgress) {
      onProgress(progress, step);
    }
  };

  try {
    // Step 1: Initial setup and URL formatting
    updateProgress(0, 'Initializing analysis...');
    const formattedUrl = url.startsWith('http') ? url : `http://${url}`;

    // Step 2: Fetch webpage content
    updateProgress(1, 'Fetching webpage content...');
    const response = await axios.get(formattedUrl, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);

    // Step 3: Basic SEO checks
    updateProgress(2, 'Performing SEO checks...');
    const title = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content');
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    const images = $('img');
    const links = $('a');
    const internalLinks = links.filter((i, el) => {
      const href = $(el).attr('href');
      return href && (href.startsWith('/') || href.includes(formattedUrl));
    }).length;
    const externalLinks = links.length - internalLinks;

    // Step 4: Required pages check
    updateProgress(3, 'Checking required pages...');
    const hasPrivacyPolicy = links.filter((i, el) => {
      const href = $(el).attr('href');
      return href && href.toLowerCase().includes('privacy');
    }).length > 0;
    const hasContactPage = links.filter((i, el) => {
      const href = $(el).attr('href');
      return href && href.toLowerCase().includes('contact');
    }).length > 0;
    const hasAboutPage = links.filter((i, el) => {
      const href = $(el).attr('href');
      return href && href.toLowerCase().includes('about');
    }).length > 0;
    const hasTermsPage = links.filter((i, el) => {
      const href = $(el).attr('href');
      return href && href.toLowerCase().includes('terms');
    }).length > 0;

    // Step 5: Security check
    updateProgress(4, 'Checking security measures...');
    const isHttps = formattedUrl.startsWith('https');
    const hasHsts = response.headers['strict-transport-security'] !== undefined;
    const hasXssProtection = response.headers['x-xss-protection'] !== undefined;
    const hasCsp = response.headers['content-security-policy'] !== undefined;

    // Step 6: Domain age check
    updateProgress(5, 'Checking domain age...');
    let domainAge = 0;
    try {
      const whoisData = await whoisLookup(formattedUrl);
      const creationDate = new Date(whoisData.creationDate);
      const now = new Date();
      domainAge = Math.round((now - creationDate) / (1000 * 60 * 60 * 24 * 30)); // Age in months
    } catch (error) {
      console.error('Error getting domain age:', error);
    }

    // Step 7: Content analysis
    updateProgress(6, 'Analyzing content...');
    const paragraphs = $('p');
    const wordCount = paragraphs.text().split(/\s+/).length;
    const avgParagraphLength = wordCount / paragraphs.length;

    // Step 8: Image analysis
    updateProgress(7, 'Analyzing images...');
    const imagesWithAlt = images.filter((i, el) => $(el).attr('alt')).length;
    const imagesWithTitle = images.filter((i, el) => $(el).attr('title')).length;

    // Step 9: Meta tags analysis
    updateProgress(8, 'Analyzing meta tags...');
    const hasViewport = $('meta[name="viewport"]').length > 0;
    const hasRobots = $('meta[name="robots"]').length > 0;
    const hasKeywords = $('meta[name="keywords"]').length > 0;
    const hasAuthor = $('meta[name="author"]').length > 0;
    const hasSocialMeta = $('meta[property^="og:"]').length > 0;

    // Step 10: Analyze performance
    updateProgress(8, 'Analyzing performance...');
    const performance = await analyzePerformance($);
    onProgress(80, 8);

    // Step 11: Analyze accessibility
    updateProgress(9, 'Analyzing accessibility...');
    const accessibility = await analyzeAccessibility($);
    onProgress(90, 9);

    // Step 12: Calculate final score
    updateProgress(10, 'Calculating final score...');
    const weights = {
      seo: 0.25,
      requiredPages: 0.15,
      security: 0.15,
      domainAge: 0.1,
      content: 0.15,
      images: 0.1,
      meta: 0.1,
      performance: 0.1,
      accessibility: 0.1
    };

    const scores = {
      seo: calculateSEOScore(title, metaDescription, h1Count, h2Count, h3Count, internalLinks, externalLinks),
      requiredPages: calculateRequiredPagesScore(hasPrivacyPolicy, hasContactPage, hasAboutPage, hasTermsPage),
      security: calculateSecurityScore(isHttps, hasHsts, hasXssProtection, hasCsp),
      domainAge: calculateDomainAgeScore(domainAge),
      content: calculateContentScore(wordCount, avgParagraphLength),
      images: calculateImageScore(images.length, imagesWithAlt, imagesWithTitle),
      meta: calculateMetaScore(hasViewport, hasRobots, hasKeywords, hasAuthor, hasSocialMeta),
      performance: calculatePerformanceScore(performance),
      accessibility: calculateAccessibilityScore(accessibility)
    };

    const finalScore = Object.entries(scores).reduce((total, [key, score]) => {
      return total + (score * weights[key]);
    }, 0);

    // Final step: Complete
    updateProgress(10, 'Analysis complete!');

    return {
      score: Math.round(finalScore),
      details: {
        seo: {
          title: { value: title, status: title ? 'passed' : 'failed' },
          metaDescription: { value: metaDescription, status: metaDescription ? 'passed' : 'failed' },
          h1Count: { value: h1Count, status: h1Count > 0 ? 'passed' : 'failed' },
          h2Count: { value: h2Count, status: h2Count > 0 ? 'passed' : 'warning' },
          h3Count: { value: h3Count, status: h3Count > 0 ? 'passed' : 'warning' },
          internalLinks: { value: internalLinks, status: internalLinks > 0 ? 'passed' : 'warning' },
          externalLinks: { value: externalLinks, status: externalLinks > 0 ? 'passed' : 'warning' }
        },
        requiredPages: {
          privacyPolicy: { value: hasPrivacyPolicy, status: hasPrivacyPolicy ? 'passed' : 'failed' },
          contactPage: { value: hasContactPage, status: hasContactPage ? 'passed' : 'failed' },
          aboutPage: { value: hasAboutPage, status: hasAboutPage ? 'passed' : 'failed' },
          termsPage: { value: hasTermsPage, status: hasTermsPage ? 'passed' : 'warning' }
        },
        security: {
          https: { value: isHttps, status: isHttps ? 'passed' : 'failed' },
          hsts: { value: hasHsts, status: hasHsts ? 'passed' : 'warning' },
          xssProtection: { value: hasXssProtection, status: hasXssProtection ? 'passed' : 'warning' },
          csp: { value: hasCsp, status: hasCsp ? 'passed' : 'warning' }
        },
        domain: {
          age: { value: `${domainAge} months`, status: domainAge >= 6 ? 'passed' : 'failed' }
        },
        content: {
          wordCount: { value: wordCount, status: wordCount >= 500 ? 'passed' : 'failed' },
          avgParagraphLength: { value: Math.round(avgParagraphLength), status: avgParagraphLength >= 50 ? 'passed' : 'warning' }
        },
        images: {
          total: { value: images.length, status: images.length > 0 ? 'passed' : 'warning' },
          withAlt: { value: imagesWithAlt, status: imagesWithAlt > 0 ? 'passed' : 'warning' },
          withTitle: { value: imagesWithTitle, status: imagesWithTitle > 0 ? 'passed' : 'warning' }
        },
        meta: {
          viewport: { value: hasViewport, status: hasViewport ? 'passed' : 'failed' },
          robots: { value: hasRobots, status: hasRobots ? 'passed' : 'warning' },
          keywords: { value: hasKeywords, status: hasKeywords ? 'passed' : 'warning' },
          author: { value: hasAuthor, status: hasAuthor ? 'passed' : 'warning' },
          socialMeta: { value: hasSocialMeta, status: hasSocialMeta ? 'passed' : 'warning' }
        },
        performance,
        accessibility
      }
    };
  } catch (error) {
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

// Helper functions for score calculations
function calculateSEOScore(title, metaDescription, h1Count, h2Count, h3Count, internalLinks, externalLinks) {
  let score = 0;
  if (title) score += 20;
  if (metaDescription) score += 20;
  if (h1Count > 0) score += 15;
  if (h2Count > 0) score += 10;
  if (h3Count > 0) score += 5;
  if (internalLinks > 0) score += 15;
  if (externalLinks > 0) score += 15;
  return score;
}

function calculateRequiredPagesScore(hasPrivacyPolicy, hasContactPage, hasAboutPage, hasTermsPage) {
  let score = 0;
  if (hasPrivacyPolicy) score += 40;
  if (hasContactPage) score += 20;
  if (hasAboutPage) score += 20;
  if (hasTermsPage) score += 20;
  return score;
}

function calculateSecurityScore(isHttps, hasHsts, hasXssProtection, hasCsp) {
  let score = 0;
  if (isHttps) score += 40;
  if (hasHsts) score += 20;
  if (hasXssProtection) score += 20;
  if (hasCsp) score += 20;
  return score;
}

function calculateDomainAgeScore(age) {
  if (age >= 12) return 100;
  if (age >= 6) return 80;
  if (age >= 3) return 60;
  if (age >= 1) return 40;
  return 20;
}

function calculateContentScore(wordCount, avgParagraphLength) {
  let score = 0;
  if (wordCount >= 1000) score += 50;
  else if (wordCount >= 500) score += 30;
  else if (wordCount >= 300) score += 20;
  else score += 10;

  if (avgParagraphLength >= 100) score += 50;
  else if (avgParagraphLength >= 50) score += 30;
  else if (avgParagraphLength >= 30) score += 20;
  else score += 10;

  return score;
}

function calculateImageScore(total, withAlt, withTitle) {
  let score = 0;
  if (total > 0) score += 40;
  if (withAlt > 0) score += 30;
  if (withTitle > 0) score += 30;
  return score;
}

function calculateMetaScore(hasViewport, hasRobots, hasKeywords, hasAuthor, hasSocialMeta) {
  let score = 0;
  if (hasViewport) score += 30;
  if (hasRobots) score += 20;
  if (hasKeywords) score += 15;
  if (hasAuthor) score += 15;
  if (hasSocialMeta) score += 20;
  return score;
}

async function analyzePerformance($) {
  const performance = {
    loadTime: { value: 'N/A', status: 'warning' },
    scripts: { value: 'N/A', status: 'warning' },
    stylesheets: { value: 'N/A', status: 'warning' }
  };

  try {
    // Count scripts
    const scriptCount = $('script').length;
    performance.scripts = {
      value: `${scriptCount} scripts found`,
      status: scriptCount > 10 ? 'warning' : 'passed'
    };

    // Count stylesheets
    const stylesheetCount = $('link[rel="stylesheet"]').length;
    performance.stylesheets = {
      value: `${stylesheetCount} stylesheets found`,
      status: stylesheetCount > 5 ? 'warning' : 'passed'
    };

    // Estimate load time based on resource count
    const totalResources = scriptCount + stylesheetCount;
    const estimatedLoadTime = Math.round((totalResources * 100) / 1000); // Rough estimate in seconds
    performance.loadTime = {
      value: `${estimatedLoadTime} seconds (estimated)`,
      status: estimatedLoadTime > 3 ? 'warning' : 'passed'
    };
  } catch (error) {
    console.error('Error analyzing performance:', error);
  }

  return performance;
}

async function analyzeAccessibility($) {
  const accessibility = {
    images: { value: 'N/A', status: 'warning' },
    links: { value: 'N/A', status: 'warning' },
    forms: { value: 'N/A', status: 'warning' }
  };

  try {
    // Analyze images
    const images = $('img');
    const imagesWithAlt = images.filter((_, img) => $(img).attr('alt')).length;
    const totalImages = images.length;
    const altTextPercentage = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 0;
    
    accessibility.images = {
      value: `${altTextPercentage}% of images have alt text (${imagesWithAlt}/${totalImages})`,
      status: altTextPercentage >= 90 ? 'passed' : altTextPercentage >= 50 ? 'warning' : 'failed'
    };

    // Analyze links
    const links = $('a');
    const linksWithText = links.filter((_, link) => $(link).text().trim()).length;
    const totalLinks = links.length;
    const linkTextPercentage = totalLinks > 0 ? Math.round((linksWithText / totalLinks) * 100) : 0;
    
    accessibility.links = {
      value: `${linkTextPercentage}% of links have descriptive text (${linksWithText}/${totalLinks})`,
      status: linkTextPercentage >= 90 ? 'passed' : linkTextPercentage >= 50 ? 'warning' : 'failed'
    };

    // Analyze forms
    const forms = $('form');
    const formsWithLabels = forms.filter((_, form) => $(form).find('label').length > 0).length;
    const totalForms = forms.length;
    const formLabelPercentage = totalForms > 0 ? Math.round((formsWithLabels / totalForms) * 100) : 0;
    
    accessibility.forms = {
      value: `${formLabelPercentage}% of forms have labels (${formsWithLabels}/${totalForms})`,
      status: formLabelPercentage >= 90 ? 'passed' : formLabelPercentage >= 50 ? 'warning' : 'failed'
    };
  } catch (error) {
    console.error('Error analyzing accessibility:', error);
  }

  return accessibility;
}

function calculatePerformanceScore(performance) {
  let score = 0;
  const maxScore = 100;

  // Script count scoring (30% of total)
  const scriptStatus = performance.scripts.status;
  if (scriptStatus === 'passed') score += 30;
  else if (scriptStatus === 'warning') score += 15;

  // Stylesheet count scoring (30% of total)
  const stylesheetStatus = performance.stylesheets.status;
  if (stylesheetStatus === 'passed') score += 30;
  else if (stylesheetStatus === 'warning') score += 15;

  // Load time scoring (40% of total)
  const loadTimeStatus = performance.loadTime.status;
  if (loadTimeStatus === 'passed') score += 40;
  else if (loadTimeStatus === 'warning') score += 20;

  return Math.round(score);
}

function calculateAccessibilityScore(accessibility) {
  let score = 0;
  const maxScore = 100;

  // Image accessibility scoring (40% of total)
  const imageStatus = accessibility.images.status;
  if (imageStatus === 'passed') score += 40;
  else if (imageStatus === 'warning') score += 20;

  // Link accessibility scoring (30% of total)
  const linkStatus = accessibility.links.status;
  if (linkStatus === 'passed') score += 30;
  else if (linkStatus === 'warning') score += 15;

  // Form accessibility scoring (30% of total)
  const formStatus = accessibility.forms.status;
  if (formStatus === 'passed') score += 30;
  else if (formStatus === 'warning') score += 15;

  return Math.round(score);
}

module.exports = { analyzeWebsite }; 