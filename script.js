// script.js
(function(){
  // 1) Get ?site= parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const siteParam = urlParams.get('site');
  if(!siteParam) {
    console.warn("No ?site= provided in URL. Page won't populate data.");
    return;
  }

  // Remove single quotes, then slugify
  const normalizedSlug = siteParam
    .replace(/'/g, '')           // remove apostrophes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');

  // 2) Fetch finalWebsiteData.json from your GitHub
  const DATA_URL = "https://raw.githubusercontent.com/greekfreek23/alabamaplumbersnowebsite/main/finalWebsiteData.json"; 

  // Hide body initially
  document.body.style.opacity = '0';

  fetch(DATA_URL)
    .then(resp => {
      if(!resp.ok) {
        throw new Error("Failed to load finalWebsiteData.json: " + resp.status);
      }
      return resp.json();
    })
    .then(json => {
      const businesses = json.finalWebsiteData || [];
      const found = businesses.find(b => (b.siteId||'').toLowerCase() === normalizedSlug);
      if(!found) {
        console.warn("No matching siteId in finalWebsiteData for:", siteParam);
        return;
      }
      initializeSite(found);
    })
    .catch(err => {
      console.error("Error loading or parsing finalWebsiteData.json:", err);
    });

  function initializeSite(data) {
    // Wait for initial content to be ready
    const images = document.querySelectorAll('img');
    let loadedImages = 0;

    // 1) Theming colors
    if(data.secondaryColor) {
      document.documentElement.style.setProperty('--primary-color', data.secondaryColor);
    }
    if(data.primaryColor) {
      document.documentElement.style.setProperty('--accent-color', data.primaryColor);
    }

    // 2) Fill placeholders
    const bn = data.businessName || "Anything Plumbing";
    document.querySelectorAll("[data-business-name]").forEach(el => {
      el.textContent = bn;
    });

    // phone
    const phone = data.phone || "(555) 123-4567";
    document.querySelectorAll("[data-phone]").forEach(el => {
      el.textContent = phone;
      if(el.tagName.toLowerCase() === 'a'){
        el.href = "tel:" + phone.replace(/\D/g, '');
      }
    });

    // email
    const email = data.email || "info@plumbing.com";
    document.querySelectorAll("[data-email]").forEach(el => {
      el.textContent = email;
      if(el.tagName.toLowerCase() === 'a'){
        el.href = "mailto:" + email;
      }
    });

    // rating
    const rating = data.rating || "5";
    document.querySelectorAll("[data-rating]").forEach(el => el.textContent = rating);

    // review count
    const revCount = data.reviewsCount || "100";
    document.querySelectorAll("[data-reviews], [data-review-count]").forEach(el => {
      el.textContent = revCount;
    });

    // city, state, street, zip
    document.querySelectorAll("[data-city]").forEach(el => {
      el.textContent = data.city || "Huntsville";
    });
    document.querySelectorAll("[data-state]").forEach(el => {
      el.textContent = data.state || "AL";
    });
    document.querySelectorAll("[data-street]").forEach(el => {
      el.textContent = data.street || "123 Pipe Street";
    });
    document.querySelectorAll("[data-zip]").forEach(el => {
      el.textContent = data.postalCode || "35801";
    });

    // logo
    if(data.logo) {
      document.querySelectorAll("[data-logo]").forEach(el => {
        el.src = data.logo;
        el.alt = bn + " Logo";
        // Add load event listener
        el.addEventListener('load', handleImageLoad);
      });
    }

    // Handle image loading
    function handleImageLoad() {
      loadedImages++;
      this.classList.add('loaded');
      if (loadedImages === images.length) {
        finishInitialization();
      }
    }

    // Add load listeners to all images
    images.forEach(img => {
      if (img.complete) {
        handleImageLoad.call(img);
      } else {
        img.addEventListener('load', handleImageLoad);
      }
    });

    // reviews link
    if(data.reviewsLink) {
      document.querySelectorAll("[data-reviewlink]").forEach(el => {
        el.href = data.reviewsLink;
      });
    }

    // About Us
    document.querySelectorAll("[data-about-content]").forEach(el => {
      el.textContent = data.aboutUs || "We proudly serve the community with reliable, top-notch plumbing.";
    });

    function finishInitialization() {
      // Initialize all components
      initHeroImages(data.photos.heroImages || []);
      initAboutSlider(data.photos.aboutUsImages || []);
      initReviews(data.fiveStarReviews || []);

      // Nav hamburger
      const hamburger = document.querySelector(".hamburger");
      const navList = document.querySelector(".nav-list");
      if(hamburger && navList) {
        hamburger.addEventListener("click", () => {
          navList.classList.toggle("active");
        });
      }

      // Start hero slider
      startHeroSlider();

      // Show the page
      setTimeout(() => {
        document.body.classList.add('loaded');
        document.body.style.opacity = '1';
      }, 100);
    }
  }

  function initHeroImages(heroImages) {
    const slides = document.querySelectorAll('.slides .slide');
    let loadedHeroImages = 0;
    const totalHeroImages = heroImages.length;

    slides.forEach((slide, index) => {
      if(heroImages[index] && heroImages[index].imageUrl) {
        const img = new Image();
        img.onload = () => {
          slide.style.backgroundImage = `url('${heroImages[index].imageUrl}')`;
          loadedHeroImages++;
          if(loadedHeroImages === totalHeroImages) {
            slide.style.opacity = '1';
          }
        };
        img.src = heroImages[index].imageUrl;
        
        const ctaEl = slide.querySelector(`[data-hero-cta="${index}"]`);
        if(ctaEl) {
          ctaEl.textContent = heroImages[index].callToAction || "";
        }
      }
    });
  }

  function initAboutSlider(aboutImages) {
    const container = document.querySelector("[data-about-slider]");
    if(!container) return;
    container.innerHTML = "";

    aboutImages.forEach((imgUrl, i) => {
      const slideDiv = document.createElement("div");
      slideDiv.className = "slide" + (i===0 ? " active" : "");
      const img = document.createElement("img");
      img.src = imgUrl;
      img.alt = `About Image ${i+1}`;
      slideDiv.appendChild(img);
      container.appendChild(slideDiv);
    });

    if(aboutImages.length > 1){
      let current = 0;
      setInterval(()=>{
        const allSlides = container.querySelectorAll(".slide");
        allSlides[current].classList.remove("active");
        current = (current+1) % allSlides.length;
        allSlides[current].classList.add("active");
      }, 5000);
    }
  }

  function initReviews(fiveStarReviews) {
    const track = document.getElementById("reviewsTrack");
    if (!track) return;
    track.innerHTML = "";

    if (!fiveStarReviews.length) {
      console.warn("No 5-star reviews found for this business.");
      return;
    }

    const duplicatedReviews = Array(20).fill(fiveStarReviews).flat();
    const SECONDS_PER_REVIEW = 5;
    const totalDuration = duplicatedReviews.length * SECONDS_PER_REVIEW;

    duplicatedReviews.forEach(r => {
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
      textEl.textContent = r.reviewText || "Excellent service!";

      card.appendChild(nameEl);
      card.appendChild(starEl);
      card.appendChild(textEl);
      track.appendChild(card);
    });

    track.style.animation = `slide ${totalDuration}s linear infinite`;

    track.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    
    track.addEventListener('mouseleave', () => {
      track.style.animationPlayState = 'running';
    });
  }

  function startHeroSlider(){
    const slides = document.querySelectorAll('.slides .slide');
    if(!slides.length) return;
    let currentIndex = 0;
    setInterval(()=>{
      slides[currentIndex].classList.remove("active");
      currentIndex = (currentIndex+1) % slides.length;
      slides[currentIndex].classList.add("active");
    }, 5000);
  }
})();
