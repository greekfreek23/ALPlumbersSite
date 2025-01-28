/* script.js */
(function(){
  // Store data globally within our closure
  let globalBusinessData = null;
  let sliderIntervals = [];

  // Track initialized sections to prevent redundant initializations
  const initializedSections = {
    reviewsSection: false,
    aboutUs: false,
    // Add more sections if needed
  };

  // ===== NEW LINES BELOW =====
  // Get place_id parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const placeId = urlParams.get('place_id');

  // If place_id is missing, we still proceed, 
  // but we warn that page data might not populate.
  if(!placeId) {
    console.warn("No ?place_id= provided in URL. Page won't populate data.");
  } else {
    // Initialize our Analytics tracking
    Analytics.init(placeId);
  }
  // ===== END OF NEW LINES =====

  const WEBSITE_DATA_URL = "https://raw.githubusercontent.com/greekfreek23/alabamaplumbersnowebsite/main/finalWebsiteData.json";
  const PHOTO_DATA_URL = "https://raw.githubusercontent.com/greekfreek23/alabamaplumbersnowebsite/main/data/businessPhotoContent.json";

  // Load data once and store it
  Promise.all([
    fetch(WEBSITE_DATA_URL).then(resp => {
      if (!resp.ok) throw new Error('Website data fetch failed');
      return resp.json();
    }),
    fetch(PHOTO_DATA_URL).then(resp => {
      if (!resp.ok) throw new Error('Photo data fetch failed');
      return resp.json();
    })
  ])
  .then(([websiteData, photoData]) => {
    const businesses = websiteData.finalWebsiteData || [];
    const business = businesses.find(b => b.siteId === placeId);

    if(!business) {
      throw new Error(`No matching business found for: ${placeId}`);
    }

    // Get photo content for this business
    const photoContent = photoData.businessPhotoContent[placeId];
    if (photoContent) {
      // Add photo data to business object
      business.photos = {
        heroImages: (photoContent.heroSection || []).map(image => ({
          imageUrl: image.imageIndex,
          callToAction: image.callToAction
        })),
        aboutUsImages: (photoContent.aboutUsSection || []).map(image => ({
          url: image.imageIndex, 
          description: image.description || ""
        }))
      };
    }

    // Store data globally
    globalBusinessData = business;

    // Initialize site with stored data
    initializeSite(globalBusinessData);

    // Initialize Intersection Observers
    initializeObservers();
  })
  .catch(err => {
    console.error("Error loading data:", err);
    showErrorMessage();
  });

  function showErrorMessage() {
    const body = document.querySelector('body');
    if (body) {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.2); z-index: 9999;';
      errorDiv.innerHTML = `
        <h3 style="color: red; margin: 0 0 10px 0;">Error Loading Data</h3>
        <p style="margin: 0;">Please refresh the page to try again.</p>
      `;
      body.appendChild(errorDiv);
    }

    // **Set a Fallback Title**
    const titleElement = document.getElementById('dynamic-title');
    if (titleElement) {
      titleElement.textContent = "Error - Plumbing Services";
    } else {
      document.title = "Error - Plumbing Services";
    }
  }

  // Intersection Observer Setup
  function initializeObservers() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver(handleIntersection, options);

    // Observe sections that need lazy initialization
    const sectionsToObserve = document.querySelectorAll('section[id]');
    sectionsToObserve.forEach(section => {
      observer.observe(section);
    });
  }

  function handleIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        reinitializeSection(sectionId);
        observer.unobserve(entry.target);
      }
    });
  }

  function reinitializeSection(sectionId) {
    if (!globalBusinessData) return;

    switch(sectionId) {
      case 'reviewsSection':
        if (!initializedSections.reviewsSection) {
          initReviews(globalBusinessData.fiveStarReviews || []);
          initializedSections.reviewsSection = true;
        }
        break;
      case 'about-us':
        if (globalBusinessData.photos && !initializedSections.aboutUs) {
          initAboutSlider(globalBusinessData.photos.aboutUsImages || []);
          initializedSections.aboutUs = true;
        }
        break;
      // Add more cases if needed
    }
  }

  function clearSliderIntervals() {
    sliderIntervals.forEach(interval => clearInterval(interval));
    sliderIntervals = [];
  }

  function initializeSite(data) {
    // Clear intervals
    clearSliderIntervals();

    // Set theme colors
    if(data.secondaryColor) {
      document.documentElement.style.setProperty('--primary-color', data.secondaryColor);
    }
    if(data.primaryColor) {
      document.documentElement.style.setProperty('--accent-color', data.primaryColor);
    }

    // Fill dynamic content
    safeQuerySelectorAll("[data-business-name]", el => {
      el.textContent = data.businessName || "Business Name Not Found";
    });

    const phone = data.phone || "";
    safeQuerySelectorAll("[data-phone]", el => {
      el.textContent = phone;
      if(el.tagName.toLowerCase() === 'a'){
        el.href = "tel:" + phone.replace(/\D/g, '');
      }
    });

    const email = data.email || "";
    safeQuerySelectorAll("[data-email]", el => {
      el.textContent = email;
      if(el.tagName.toLowerCase() === 'a'){
        el.href = "mailto:" + email;
      }
    });

    safeQuerySelectorAll("[data-rating]", el => el.textContent = data.rating || "");
    safeQuerySelectorAll("[data-reviews], [data-review-count]", el => {
      el.textContent = data.reviewsCount || "0";
    });

    // Location info
    safeQuerySelectorAll("[data-city]", el => el.textContent = data.city || "");
    safeQuerySelectorAll("[data-state]", el => el.textContent = data.state || "");
    safeQuerySelectorAll("[data-street]", el => el.textContent = data.street || "");
    safeQuerySelectorAll("[data-zip]", el => el.textContent = data.postalCode || "");

    // Logo
    if(data.logo) {
      safeQuerySelectorAll("[data-logo]", el => {
        el.src = data.logo;
        el.alt = data.businessName + " Logo";
      });
    }

    // Review link
    if(data.reviewsLink) {
      safeQuerySelectorAll("[data-reviewlink]", el => {
        el.href = data.reviewsLink;
      });
    }

    // About content
    safeQuerySelectorAll("[data-about-content]", el => {
      el.textContent = data.aboutUs || "";
    });

    // Dynamically update the page title
    const dynamicTitle = `${data.businessName || 'Plumbing Services'} - ${data.tagline || 'Your Trusted Plumber'}`;
    const titleElement = document.getElementById('dynamic-title');
    if (titleElement) {
      titleElement.textContent = dynamicTitle;
    } else {
      document.title = dynamicTitle;
    }

    // Initialize components visible on page load
    if (isElementInViewport(document.getElementById('about-us'))) {
      if (data.photos && !initializedSections.aboutUs) {
        initAboutSlider(data.photos.aboutUsImages || []);
        initializedSections.aboutUs = true;
      }
    }
    if (isElementInViewport(document.getElementById('reviewsSection'))) {
      if (!initializedSections.reviewsSection) {
        initReviews(data.fiveStarReviews || []);
        initializedSections.reviewsSection = true;
      }
    }

    // Mobile menu toggle
    const hamburger = document.querySelector(".hamburger");
    const navList = document.querySelector(".nav-list");
    if(hamburger && navList) {
      hamburger.addEventListener("click", () => {
        navList.classList.toggle("active");
      });
    }

    // Initialize hero images & slider
    if (data.photos) {
      initHeroImages(data.photos.heroImages || []);
      startHeroSlider();
    }
  }

  function safeQuerySelectorAll(selector, callback) {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(callback);
    } catch (error) {
      console.warn(`Error processing selector ${selector}:`, error);
    }
  }

  function initHeroImages(heroImages) {
    const slides = document.querySelectorAll('.slides .slide');
    if (!slides.length) return;

    slides.forEach((slide, index) => {
      const image = heroImages[index];
      if(image && image.imageUrl) {
        // Preload
        const img = new Image();
        img.onload = () => {
          slide.style.backgroundImage = `url('${image.imageUrl}')`;
        };
        img.src = image.imageUrl;

        const ctaEl = slide.querySelector(`[data-hero-cta="${index}"]`);
        if(ctaEl && image.callToAction) {
          ctaEl.textContent = image.callToAction;
        }
      }
    });
  }

  function initAboutSlider(aboutImages) {
    const container = document.querySelector("[data-about-slider]");
    if(!container || !aboutImages.length) return;
    if (container.dataset.initialized === "true") return;

    container.dataset.initialized = "true";
    container.innerHTML = "";

    // Preload all images
    const imagePromises = aboutImages.map(image => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(image);
        img.onerror = () => resolve(null);
        img.src = image.url;
      });
    });

    Promise.all(imagePromises)
      .then(loadedImages => {
        const validImages = loadedImages.filter(img => img);
        if (!validImages.length) return;

        validImages.forEach((image, i) => {
          const slideDiv = document.createElement("div");
          slideDiv.className = "slide" + (i === 0 ? " active" : "");

          const imgEl = document.createElement("img");
          imgEl.src = image.url;
          imgEl.alt = image.description || `About Image ${i+1}`;

          slideDiv.appendChild(imgEl);
          container.appendChild(slideDiv);
        });

        if(validImages.length > 1){
          let current = 0;
          const interval = setInterval(()=>{
            const allSlides = container.querySelectorAll(".slide");
            if (!allSlides.length) {
              clearInterval(interval);
              return;
            }
            allSlides[current].classList.remove("active");
            current = (current+1) % allSlides.length;
            allSlides[current].classList.add("active");
          }, 5000);
          sliderIntervals.push(interval);
        }
      })
      .catch(err => {
        console.error("Error loading about slider images:", err);
      });
  }

  function initReviews(fiveStarReviews) {
    const track = document.getElementById("reviewsTrack");
    if (!track || !fiveStarReviews.length) return;
    if (track.dataset.initialized === "true") return;

    track.dataset.initialized = "true";
    while (track.firstChild) {
      track.removeChild(track.firstChild);
    }

    const DUPLICATION_FACTOR = 5;
    const duplicatedReviews = Array(DUPLICATION_FACTOR).fill(fiveStarReviews).flat();
    const MAX_REVIEWS = 100;
    const limitedReviews = duplicatedReviews.slice(0, MAX_REVIEWS);

    const SECONDS_PER_REVIEW = 5;
    const totalDuration = limitedReviews.length * SECONDS_PER_REVIEW;

    const fragment = document.createDocumentFragment();
    limitedReviews.forEach(r => {
      if (!r || typeof r !== 'object') return;

      const card = document.createElement("div");
      card.className = "review-card";
      card.style.flex = "0 0 300px";

      const nameEl = document.createElement("h4");
      nameEl.className = "reviewer-name";
      nameEl.textContent = r.reviewerName || "Anonymous";

      const starEl = document.createElement("div");
      starEl.className = "review-stars";
      starEl.textContent = "★★★★★";

      const textEl = document.createElement("p");
      textEl.className = "review-text";
      textEl.textContent = r.reviewText || "";

      card.appendChild(nameEl);
      card.appendChild(starEl);
      card.appendChild(textEl);
      fragment.appendChild(card);
    });

    track.appendChild(fragment);

    track.style.animation = 'none';
    void track.offsetWidth; // reflow
    track.style.animation = `slide ${totalDuration}s linear infinite`;

    const handlePause = () => track.style.animationPlayState = 'paused';
    const handleResume = () => track.style.animationPlayState = 'running';

    track.addEventListener('mouseenter', handlePause);
    track.addEventListener('mouseleave', handleResume);
    track.addEventListener('touchstart', handlePause);
    track.addEventListener('touchend', handleResume);
  }

  function startHeroSlider() {
    const slides = document.querySelectorAll('.slides .slide');
    if(!slides.length) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (!document.contains(slides[0])) {
        clearInterval(interval);
        return;
      }
      slides[currentIndex].classList.remove("active");
      currentIndex = (currentIndex + 1) % slides.length;
      slides[currentIndex].classList.add("active");
    }, 5000);
    sliderIntervals.push(interval);
  }

  window.addEventListener('beforeunload', () => {
    clearSliderIntervals();
  });

  function isElementInViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom > 0
    );
  }
})();



