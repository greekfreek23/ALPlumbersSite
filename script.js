// script.js
(function(){
  // Get place_id parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const placeId = urlParams.get('place_id'); // Changed from 'site' to 'place_id'
  
  if(!placeId) {
    console.warn("No ?place_id= provided in URL. Page won't populate data.");
    return;
  }

  // No need to normalize place_id as they are already standardized by Google
  const DATA_URL = "https://raw.githubusercontent.com/greekfreek23/alabamaplumbersnowebsite/main/finalWebsiteData.json"; 

  fetch(DATA_URL)
    .then(resp => {
      if(!resp.ok) {
        throw new Error("Failed to load finalWebsiteData.json: " + resp.status);
      }
      return resp.json();
    })
    .then(json => {
      const businesses = json.finalWebsiteData || [];
      // Find business by place_id instead of siteId
      const found = businesses.find(b => b.siteId === placeId);
      if(!found) {
        console.warn("No matching place_id in finalWebsiteData for:", placeId);
        return;
      }
      initializeSite(found);
    })
    .catch(err => {
      console.error("Error loading or parsing finalWebsiteData.json:", err);
    });

  function initializeSite(data) {
    // Set theme colors first
    if(data.secondaryColor) {
      document.documentElement.style.setProperty('--primary-color', data.secondaryColor);
    }
    if(data.primaryColor) {
      document.documentElement.style.setProperty('--accent-color', data.primaryColor);
    }

    // Fill in all the dynamic content
    const businessName = data.businessName || "Business Name Not Found";
    document.querySelectorAll("[data-business-name]").forEach(el => {
      el.textContent = businessName;
    });

    const phone = data.phone || "";
    document.querySelectorAll("[data-phone]").forEach(el => {
      el.textContent = phone;
      if(el.tagName.toLowerCase() === 'a'){
        el.href = "tel:" + phone.replace(/\D/g, '');
      }
    });

    const email = data.email || "";
    document.querySelectorAll("[data-email]").forEach(el => {
      el.textContent = email;
      if(el.tagName.toLowerCase() === 'a'){
        el.href = "mailto:" + email;
      }
    });

    const rating = data.rating || "";
    document.querySelectorAll("[data-rating]").forEach(el => el.textContent = rating);

    const reviewCount = data.reviewsCount || "0";
    document.querySelectorAll("[data-reviews], [data-review-count]").forEach(el => {
      el.textContent = reviewCount;
    });

    // Location info
    document.querySelectorAll("[data-city]").forEach(el => {
      el.textContent = data.city || "";
    });
    document.querySelectorAll("[data-state]").forEach(el => {
      el.textContent = data.state || "";
    });
    document.querySelectorAll("[data-street]").forEach(el => {
      el.textContent = data.street || "";
    });
    document.querySelectorAll("[data-zip]").forEach(el => {
      el.textContent = data.postalCode || "";
    });

    // Logo
    if(data.logo) {
      document.querySelectorAll("[data-logo]").forEach(el => {
        el.src = data.logo;
        el.alt = businessName + " Logo";
      });
    }

    // Review link
    if(data.reviewsLink) {
      document.querySelectorAll("[data-reviewlink]").forEach(el => {
        el.href = data.reviewsLink;
      });
    }

    // About content
    document.querySelectorAll("[data-about-content]").forEach(el => {
      el.textContent = data.aboutUs || "";
    });

    // Working hours if available
    if (data.workingHours) {
      document.querySelectorAll("[data-hours]").forEach(el => {
        const day = el.getAttribute("data-hours");
        if (day && data.workingHours[day]) {
          el.textContent = data.workingHours[day];
        }
      });
    }

    // Initialize components
    if (data.photos) {
      initHeroImages(data.photos.heroImages || []);
      initAboutSlider(data.photos.aboutUsImages || []);
    }
    initReviews(data.fiveStarReviews || []);

    // Mobile menu handler
    const hamburger = document.querySelector(".hamburger");
    const navList = document.querySelector(".nav-list");
    if(hamburger && navList) {
      hamburger.addEventListener("click", () => {
        navList.classList.toggle("active");
      });
    }

    // Start hero slider
    startHeroSlider();
  }

  function initHeroImages(heroImages) {
    const slides = document.querySelectorAll('.slides .slide');
    slides.forEach((slide, index) => {
      const image = heroImages[index];
      if(image && image.imageUrl) {
        slide.style.backgroundImage = `url('${image.imageUrl}')`;
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
    
    container.innerHTML = "";

    aboutImages.forEach((image, i) => {
      const slideDiv = document.createElement("div");
      slideDiv.className = "slide" + (i===0 ? " active" : "");
      
      const img = document.createElement("img");
      img.src = image.url || image; // Handle both object and string formats
      img.alt = image.description || `About Image ${i+1}`;
      
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
    if (!track || !fiveStarReviews.length) return;
    
    track.innerHTML = "";

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
      textEl.textContent = r.reviewText || "";

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
