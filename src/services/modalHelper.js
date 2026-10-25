/**
 * Modal Helper Service
 * Provides touch swipe-to-close gestures on mobile and intercepts browser
 * back navigation so edge-swiping closes the active modal instead of leaving the app.
 */

function setupModalSwipeAndHistory(modalEl, dialogEl, closeFn) {
  let isClosed = false;
  let startX = 0;
  let startY = 0;
  let deltaX = 0;
  let isSwiping = false;

  // 1. Intercept browser back navigation
  const modalHistoryState = { chessIqModal: true, timestamp: Date.now() };
  try {
    history.pushState(modalHistoryState, '');
  } catch {}

  const handlePopState = () => {
    if (isClosed) return;
    isClosed = true;
    closeFn();
  };
  window.addEventListener('popstate', handlePopState, { once: true });

  const safeClose = () => {
    if (isClosed) return;
    isClosed = true;
    window.removeEventListener('popstate', handlePopState);
    try {
      if (history.state && history.state.chessIqModal) {
        history.back();
      }
    } catch {}
    closeFn();
  };

  // 2. Touch swipe gesture detection on modal dialog
  const target = dialogEl || modalEl;
  if (!target) return safeClose;

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    deltaX = 0;
    isSwiping = false;
  };

  const onTouchMove = (e) => {
    if (e.touches.length !== 1) return;
    const curX = e.touches[0].clientX;
    const curY = e.touches[0].clientY;
    const diffX = curX - startX;
    const diffY = curY - startY;

    if (!isSwiping) {
      if (Math.abs(diffX) > 15 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
        isSwiping = true;
      }
    }

    if (isSwiping) {
      deltaX = diffX;
      target.classList.add('modal-swiping');
      target.style.transform = `translateX(${deltaX}px)`;
    }
  };

  const onTouchEnd = () => {
    target.classList.remove('modal-swiping');
    if (isSwiping && Math.abs(deltaX) > 65) {
      target.classList.add('modal-swipe-closing');
      target.style.transform = `translateX(${deltaX > 0 ? '100%' : '-100%'})`;
      setTimeout(() => {
        safeClose();
      }, 180);
    } else {
      target.style.transform = '';
    }
    isSwiping = false;
  };

  target.addEventListener('touchstart', onTouchStart, { passive: true });
  target.addEventListener('touchmove', onTouchMove, { passive: true });
  target.addEventListener('touchend', onTouchEnd, { passive: true });

  return safeClose;
}

if (typeof window !== 'undefined') {
  window.setupModalSwipeAndHistory = setupModalSwipeAndHistory;
}
