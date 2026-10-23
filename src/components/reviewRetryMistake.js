const Chess = window.Chess;
import { soundService } from '../services/sound.js';

export function startRetryMistake(dashboard) {
  const cur = dashboard.getCurrentEval();
  if (!cur || !cur.bestMoveUci || !cur.fenBefore) return;

  dashboard.isRetryingMistake = true;
  dashboard.retryHintActive = false;

  const banner = dashboard.container.querySelector('#pv-banner-area');
  if (banner) {
    const turnName = cur.color === 'w' ? 'White' : 'Black';
    banner.classList.remove('d-none');
    banner.innerHTML = `
      <div class="alert alert-warning comic-card-sm d-flex align-items-center justify-content-between p-2.5 mb-2 rounded-3">
        <div class="d-flex align-items-center gap-2">
          <span class="spinner-grow spinner-grow-sm text-warning"></span>
          <span class="small fw-bold">Retry Mistake · <strong>${turnName}</strong> to find the best move</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-sm btn-outline-dark fw-bold comic-btn" id="retry-hint-btn">Hint</button>
          <button type="button" class="btn btn-sm btn-light fw-bold comic-btn" id="retry-exit-btn">Exit</button>
        </div>
      </div>
    `;

    banner.querySelector('#retry-hint-btn')?.addEventListener('click', () => {
      dashboard.retryHintActive = true;
      const fromSq = cur.bestMoveUci.slice(0, 2);
      const hintEl = banner.querySelector('strong');
      if (hintEl) hintEl.textContent = `Hint: piece starts on ${fromSq}`;
      if (dashboard.board) {
        dashboard.board.setProps({
          bestMove: { from: fromSq, to: fromSq }
        });
      }
    });

    banner.querySelector('#retry-exit-btn')?.addEventListener('click', () => {
      stopRetryMistake(dashboard);
    });
  }

  if (dashboard.board) {
    const testChess = new Chess(cur.fenBefore);
    dashboard.board.setProps({
      fen: cur.fenBefore,
      orientation: dashboard.orientation,
      interactive: true,
      lastMove: null,
      bestMove: null,
      secondBestMove: null,
      threatMove: null,
      badge: null,
      legalMovesFrom: (sq) => {
        const moves = testChess.moves({ square: sq, verbose: true });
        return moves.map((m) => m.to);
      },
      onMove: (from, to) => {
        const promo = (to.endsWith('8') || to.endsWith('1')) ? 'q' : undefined;
        const playedUci = `${from}${to}${promo || ''}`;
        const isCorrect = playedUci.startsWith(cur.bestMoveUci.slice(0, 4));

        if (isCorrect) {
          soundService.playSuccess();
          try {
            if (typeof window.confetti === 'function') {
              window.confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
            }
          } catch {}

          const bannerAlert = banner?.querySelector('.alert');
          if (bannerAlert) {
            bannerAlert.className = 'alert alert-success comic-card-sm d-flex align-items-center justify-content-between p-2.5 mb-2 rounded-3';
            bannerAlert.innerHTML = `
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-check-circle-fill text-success fs-5"></i>
                <span class="small fw-bold">Solved! That's the best move: <strong>${cur.bestMoveSan || cur.bestMoveUci}</strong></span>
              </div>
            `;
          }

          testChess.move({ from, to, promotion: promo });
          dashboard.board?.setProps({
            fen: testChess.fen(),
            interactive: false,
            lastMove: { from, to }
          });

          setTimeout(() => {
            stopRetryMistake(dashboard);
          }, 1800);
        } else {
          soundService.playBlunder();
          const bannerStrong = banner?.querySelector('strong');
          if (bannerStrong) {
            bannerStrong.textContent = `Not quite. Try another move!`;
          }
          dashboard.board?.setProps({ fen: cur.fenBefore, interactive: true });
        }
      }
    });
  }
}

export function stopRetryMistake(dashboard) {
  dashboard.isRetryingMistake = false;
  dashboard.retryHintActive = false;
  const banner = dashboard.container.querySelector('#pv-banner-area');
  if (banner) {
    banner.innerHTML = '';
    banner.classList.add('d-none');
  }
  dashboard.updateBoardAndControls();
}
