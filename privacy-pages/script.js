/**
 * TradeLine 24/7 Privacy Pages - Interactive JavaScript
 * Industrial Precision with Human Warmth
 */

class PrivacyPages {
  constructor() {
    this.init();
  }

  init() {
    this.setupScrollEffects();
    this.setupAccordion();
    this.setupTableOfContents();
    this.setupReadingProgress();
    this.setupFormValidation();
    this.setupAnimations();
    this.setupMobileMenu();
    this.setupKeyboardNavigation();
  }

  // ============================================================================
  // SCROLL EFFECTS & ANIMATIONS
  // ============================================================================

  setupScrollEffects() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe all content sections
    document.querySelectorAll('.content-section, .summary-card').forEach(section => {
      observer.observe(section);
    });
  }

  setupAnimations() {
    // Animate hero elements on load
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroCta = document.querySelector('.hero-cta');

    if (heroTitle) {
      heroTitle.style.opacity = '0';
      heroTitle.style.transform = 'translateY(30px)';
      setTimeout(() => {
        heroTitle.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        heroTitle.style.opacity = '1';
        heroTitle.style.transform = 'translateY(0)';
      }, 100);
    }

    if (heroSubtitle) {
      heroSubtitle.style.opacity = '0';
      heroSubtitle.style.transform = 'translateY(20px)';
      setTimeout(() => {
        heroSubtitle.style.transition = 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s';
        heroSubtitle.style.opacity = '1';
        heroSubtitle.style.transform = 'translateY(0)';
      }, 200);
    }

    if (heroCta) {
      heroCta.style.opacity = '0';
      heroCta.style.transform = 'translateY(20px)';
      setTimeout(() => {
        heroCta.style.transition = 'opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s';
        heroCta.style.opacity = '1';
        heroCta.style.transform = 'translateY(0)';
      }, 400);
    }

    // Header scroll effect
    const header = document.querySelector('.site-header');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScrollY = currentScrollY;
    });
  }

  // ============================================================================
  // ACCORDION FUNCTIONALITY
  // ============================================================================

  setupAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const isActive = item.classList.contains('active');

        // Close all accordions
        document.querySelectorAll('.accordion-item').forEach(accItem => {
          accItem.classList.remove('active');
        });

        // Open clicked accordion if it wasn't active
        if (!isActive) {
          item.classList.add('active');
        }
      });

      // Keyboard support
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });
  }

  // ============================================================================
  // TABLE OF CONTENTS
  // ============================================================================

  setupTableOfContents() {
    const tocLinks = document.querySelectorAll('.toc-link');
    const sections = document.querySelectorAll('.content-section');

    // Smooth scroll to sections
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          const offsetTop = targetSection.offsetTop - 100;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });

    // Update active TOC link on scroll
    const updateActiveTocLink = () => {
      const scrollPosition = window.scrollY + 200;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        const sectionId = section.id;

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          document.querySelectorAll('.toc-link').forEach(link => {
            link.classList.remove('active');
          });

          const activeLink = document.querySelector(`.toc-link[href="#${sectionId}"]`);
          if (activeLink) {
            activeLink.classList.add('active');
          }
        }
      });
    };

    window.addEventListener('scroll', updateActiveTocLink);
    updateActiveTocLink(); // Initial call
  }

  // ============================================================================
  // READING PROGRESS BAR
  // ============================================================================

  setupReadingProgress() {
    const progressBar = document.querySelector('.progress-bar');
    if (!progressBar) return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      progressBar.style.width = Math.min(scrollPercent, 100) + '%';
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress(); // Initial call
  }

  // ============================================================================
  // FORM VALIDATION (DELETE ACCOUNT PAGE)
  // ============================================================================

  setupFormValidation() {
    const form = document.getElementById('delete-account-form');
    if (!form) return;

    const emailInput = document.getElementById('email');
    const checkboxes = document.querySelectorAll('input[type="checkbox"][required]');
    const submitBtn = document.querySelector('.btn-primary');

    const validateForm = () => {
      let isValid = true;

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailInput && !emailRegex.test(emailInput.value.trim())) {
        emailInput.classList.add('error');
        isValid = false;
      } else if (emailInput) {
        emailInput.classList.remove('error');
      }

      // Checkbox validation
      const requiredCheckboxes = Array.from(checkboxes).filter(cb => cb.hasAttribute('required'));
      const checkedRequired = requiredCheckboxes.filter(cb => cb.checked).length;

      if (checkedRequired !== requiredCheckboxes.length) {
        isValid = false;
      }

      // Update submit button
      if (submitBtn) {
        submitBtn.disabled = !isValid;
      }

      return isValid;
    };

    // Real-time validation
    if (emailInput) {
      emailInput.addEventListener('input', validateForm);
    }

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', validateForm);
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateForm()) {
        this.showMessage('Please correct the errors above and try again.', 'error');
        return;
      }

      // Show loading state
      if (submitBtn) {
        submitBtn.innerHTML = '<span class="spinner"></span> Processing...';
        submitBtn.disabled = true;
      }

      // Simulate form submission (replace with actual API call)
      setTimeout(() => {
        this.handleFormSuccess();
      }, 2000);
    });

    // Initial validation
    validateForm();
  }

  handleFormSuccess() {
    const formSection = document.querySelector('.form-section');
    const successMessage = document.createElement('div');
    successMessage.className = 'message message-success animate-fade-in-up';
    successMessage.innerHTML = `
      <div class="message-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <div class="message-content">
        <h3>Request Received</h3>
        <p>Check your email for a verification link. We'll process your deletion request within 48 hours.</p>
        <a href="/" class="btn btn-primary" style="margin-top: 1rem;">Return Home</a>
      </div>
    `;

    if (formSection) {
      formSection.innerHTML = '';
      formSection.appendChild(successMessage);
    }
  }

  showMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type} animate-fade-in-up`;
    messageEl.innerHTML = `
      <div class="message-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <div class="message-content">
        <p>${message}</p>
      </div>
    `;

    const form = document.getElementById('delete-account-form');
    if (form) {
      form.parentNode.insertBefore(messageEl, form);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      messageEl.remove();
    }, 5000);
  }

  // ============================================================================
  // MOBILE MENU
  // ============================================================================

  setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.nav-links');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('mobile-open');

      if (isOpen) {
        nav.classList.remove('mobile-open');
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        nav.classList.add('mobile-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('mobile-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close menu on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768) {
        nav.classList.remove('mobile-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  setupKeyboardNavigation() {
    // Skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const mainContent = document.querySelector('main') || document.querySelector('.main-content');
        if (mainContent) {
          mainContent.focus();
          mainContent.scrollIntoView();
        }
      });
    }

    // Enhanced focus management for accordions
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close any open accordions
        document.querySelectorAll('.accordion-item.active').forEach(item => {
          item.classList.remove('active');
        });

        // Close mobile menu
        const mobileMenu = document.querySelector('.nav-links.mobile-open');
        if (mobileMenu) {
          mobileMenu.classList.remove('mobile-open');
          const toggle = document.querySelector('.mobile-menu-toggle');
          if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
          }
        }
      }
    });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PrivacyPages();
  });
} else {
  new PrivacyPages();
}

// Export for potential external use
window.PrivacyPages = PrivacyPages;
