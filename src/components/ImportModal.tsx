import React, { useState } from 'react';
import {
  X,
  Search,
  Globe,
  FileText,
  Loader2,
  ChevronRight,
  User,
} from 'lucide-react';
import {
  RawGameSummary,
  fetchChessComGames,
  fetchLichessGames,
} from '../services/importApi';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPgn: (pgn: string, userColor: 'w' | 'b') => void;
  isAnalyzing: boolean;
  analysisProgress: { current: number; total: number };
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onSelectPgn,
  isAnalyzing,
  analysisProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'chesscom' | 'lichess' | 'pgn'>('chesscom');
  const [username, setUsername] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchedGames, setFetchedGames] = useState<RawGameSummary[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [customPgn, setCustomPgn] = useState('');
  const [customColor, setCustomColor] = useState<'w' | 'b'>('w');

  if (!isOpen) return null;

  const handleSearchPlatform = async () => {
    if (!username.trim()) return;
    setFetching(true);
    setFetchError(null);
    setFetchedGames([]);

    try {
      if (activeTab === 'chesscom') {
        const games = await fetchChessComGames(username);
        setFetchedGames(games);
        if (games.length === 0) setFetchError('No recent games found for this player.');
      } else if (activeTab === 'lichess') {
        const games = await fetchLichessGames(username);
        setFetchedGames(games);
        if (games.length === 0) setFetchError('No recent games found for this player.');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to fetch games.');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#211f1c] border-2 border-black/10 dark:border-[#36332e] shadow-2xl overflow-hidden text-zinc-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-[#36332e] bg-zinc-50 dark:bg-[#262421]">
          <h3 className="text-base font-black">Import Game for Comic Review</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isAnalyzing}
            className="p-1.5 rounded-xl text-zinc-500 hover:text-black dark:text-[#9c978f] dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#322f2a] transition-all disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons: Chess.com, Lichess, Paste PGN */}
        <div className="grid grid-cols-3 p-2 gap-1.5 bg-zinc-100 dark:bg-[#181715] border-b border-zinc-200 dark:border-[#36332e]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('chesscom');
              setFetchError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'chesscom'
                ? 'bg-amber-400 text-black border border-black shadow-[1.5px_1.5px_0px_#000000]'
                : 'text-zinc-600 dark:text-[#9c978f] hover:text-black dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Chess.com</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('lichess');
              setFetchError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'lichess'
                ? 'bg-amber-400 text-black border border-black shadow-[1.5px_1.5px_0px_#000000]'
                : 'text-zinc-600 dark:text-[#9c978f] hover:text-black dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span>Lichess</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('pgn');
              setFetchError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'pgn'
                ? 'bg-amber-400 text-black border border-black shadow-[1.5px_1.5px_0px_#000000]'
                : 'text-zinc-600 dark:text-[#9c978f] hover:text-black dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Paste PGN</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Analysis Progress Screen */}
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
              <h4 className="text-base font-black">Analyzing Imported Game with Stockfish...</h4>
              <p className="text-xs text-zinc-500 dark:text-[#9c978f] mt-1 font-medium">
                Evaluating ply {analysisProgress.current} of {analysisProgress.total} · Generating comic
                sound effect badges
              </p>
              <div className="w-48 h-2.5 rounded-full bg-zinc-200 dark:bg-[#181715] overflow-hidden mt-4 border border-zinc-300 dark:border-transparent">
                <div
                  style={{
                    width: `${
                      analysisProgress.total > 0
                        ? (analysisProgress.current / analysisProgress.total) * 100
                        : 0
                    }%`,
                  }}
                  className="h-full bg-amber-400 transition-all duration-150"
                />
              </div>
            </div>
          ) : activeTab === 'chesscom' || activeTab === 'lichess' ? (
            /* Platform API Search */
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-[#78746c]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchPlatform()}
                    placeholder={`Enter ${activeTab === 'chesscom' ? 'Chess.com' : 'Lichess'} username...`}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#181715] border border-zinc-300 dark:border-[#36332e] text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#68645d] focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchPlatform}
                  disabled={fetching || !username.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs border border-black shadow-[1.5px_1.5px_0px_#000000] active:translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Fetch</span>
                </button>
              </div>

              {fetchError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-200 text-xs font-medium">
                  {fetchError}
                </div>
              )}

              {fetchedGames.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-500 dark:text-[#8e8a83]">
                    Select a recent game to analyze:
                  </span>
                  {fetchedGames.map((g) => {
                    const isWhite = g.white.toLowerCase() === username.trim().toLowerCase();
                    return (
                      <div
                        key={g.id}
                        onClick={() => onSelectPgn(g.pgn, isWhite ? 'w' : 'b')}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#262421] border border-zinc-200 dark:border-[#36332e] hover:border-amber-400 cursor-pointer active:scale-98 transition-all group"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black group-hover:text-amber-500 transition-colors">
                            {g.white} vs {g.black}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-[#8e8a83] mt-0.5">
                            {g.date} · Result: {g.result}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-zinc-200 dark:bg-[#181715] text-zinc-800 dark:text-zinc-300">
                            {g.timeControl}
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Paste PGN Tab */
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-zinc-500 dark:text-[#8e8a83]">
                Paste any PGN notation below:
              </span>
              <textarea
                value={customPgn}
                onChange={(e) => setCustomPgn(e.target.value)}
                placeholder={'[Event "Live Chess"]\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5...'}
                rows={6}
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-[#181715] border border-zinc-300 dark:border-[#36332e] text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-[#68645d] focus:outline-none focus:border-amber-400"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-zinc-500 dark:text-[#8e8a83]">Analyze from perspective of:</span>
                <div className="flex rounded-xl bg-zinc-100 dark:bg-[#181715] p-1 border border-zinc-200 dark:border-[#36332e]">
                  <button
                    type="button"
                    onClick={() => setCustomColor('w')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      customColor === 'w'
                        ? 'bg-white text-black shadow-sm border border-zinc-300'
                        : 'text-zinc-500 dark:text-[#8e8a83]'
                    }`}
                  >
                    White
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomColor('b')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      customColor === 'b'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 dark:text-[#8e8a83]'
                    }`}
                  >
                    Black
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectPgn(customPgn, customColor)}
                disabled={!customPgn.trim()}
                className="w-full mt-2 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-y-0.5 transition-all disabled:opacity-40"
              >
                Analyze PGN with Comic Badges ⚡
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
