import React, { useState } from 'react';
import {
  X,
  Search,
  Globe,
  FileText,
  Flame,
  Loader2,
  Check,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react';
import {
  PRELOADED_GAMES,
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
  const [activeTab, setActiveTab] = useState<'preloaded' | 'chesscom' | 'lichess' | 'pgn'>('preloaded');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[#211f1c] border border-[#36332e] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#36332e] bg-[#262421]">
          <h3 className="text-base font-bold text-white">Import Game for Analysis</h3>
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="p-1.5 rounded-xl text-[#9c978f] hover:text-white hover:bg-[#322f2a] transition-all disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-4 p-2 gap-1 bg-[#181715] border-b border-[#36332e]">
          <button
            onClick={() => {
              setActiveTab('preloaded');
              setFetchError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'preloaded'
                ? 'bg-[#2e2b26] text-white shadow-sm'
                : 'text-[#9c978f] hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Master</span>
            <span>Games</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('chesscom');
              setFetchError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'chesscom'
                ? 'bg-[#2e2b26] text-white shadow-sm'
                : 'text-[#9c978f] hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Chess.com</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('lichess');
              setFetchError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'lichess'
                ? 'bg-[#2e2b26] text-white shadow-sm'
                : 'text-[#9c978f] hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Lichess</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pgn');
              setFetchError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'pgn'
                ? 'bg-[#2e2b26] text-white shadow-sm'
                : 'text-[#9c978f] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Paste PGN</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Analysis Progress Screen */}
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-10 h-10 text-amber-400 animate-spin mb-4" />
              <h4 className="text-base font-bold text-white">Analyzing Game with 3-Tier Engine...</h4>
              <p className="text-xs text-[#9c978f] mt-1">
                Evaluating ply {analysisProgress.current} of {analysisProgress.total} · Checking tactical sacrifices
              </p>
              <div className="w-48 h-2 rounded-full bg-[#181715] overflow-hidden mt-4">
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
          ) : activeTab === 'preloaded' ? (
            /* Preloaded Master Games */
            <div className="flex flex-col gap-3">
              <span className="text-xs text-[#8e8a83]">
                Instant demo games featuring brilliant sacrifices and tactical blunders:
              </span>
              {PRELOADED_GAMES.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectPgn(item.pgn, item.userColor)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#262421] border border-[#36332e] hover:border-amber-400/50 cursor-pointer active:scale-[0.99] transition-all group"
                >
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-xs text-[#c7c4c0] mt-0.5">{item.players}</span>
                    <span className="text-[11px] text-[#8e8a83] mt-1">{item.subtitle}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#6d6962] group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          ) : activeTab === 'chesscom' || activeTab === 'lichess' ? (
            /* Platform API Search */
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78746c]" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchPlatform()}
                    placeholder={`Enter ${activeTab === 'chesscom' ? 'Chess.com' : 'Lichess'} username...`}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#181715] border border-[#36332e] text-sm text-white placeholder-[#68645d] focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearchPlatform}
                  disabled={fetching || !username.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Fetch</span>
                </button>
              </div>

              {fetchError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs">
                  {fetchError}
                </div>
              )}

              {/* Games List */}
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {fetchedGames.map((g) => {
                  const isWhite = g.white.toLowerCase() === username.toLowerCase();
                  return (
                    <div
                      key={g.id}
                      onClick={() => onSelectPgn(g.pgn, isWhite ? 'w' : 'b')}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#262421] border border-[#36332e] hover:border-amber-400/50 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">
                          {g.white} ({g.whiteElo}) vs {g.black} ({g.blackElo})
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-[#8e8a83] mt-0.5 font-mono">
                          <span>{g.timeControl}</span>
                          <span>·</span>
                          <span>{g.date}</span>
                          <span>·</span>
                          <span className="text-amber-400 font-bold">{g.result}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#6d6962]" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Paste PGN */
            <div className="flex flex-col gap-3">
              <span className="text-xs text-[#8e8a83]">
                Paste full PGN notation with optional [%clk] timestamps:
              </span>
              <textarea
                value={customPgn}
                onChange={(e) => setCustomPgn(e.target.value)}
                placeholder='1. e4 {[%clk 0:05:00]} e5 {[%clk 0:04:58]} 2. Nf3 Nc6...'
                rows={6}
                className="w-full p-3 rounded-xl bg-[#181715] border border-[#36332e] text-xs font-mono text-white placeholder-[#68645d] focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8e8a83]">Analyze as:</span>
                  <div className="flex rounded-lg bg-[#181715] p-1 border border-[#36332e]">
                    <button
                      onClick={() => setCustomColor('w')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        customColor === 'w' ? 'bg-white text-black' : 'text-[#8e8a83]'
                      }`}
                    >
                      White
                    </button>
                    <button
                      onClick={() => setCustomColor('b')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                        customColor === 'b' ? 'bg-[#36332e] text-white' : 'text-[#8e8a83]'
                      }`}
                    >
                      Black
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => customPgn.trim() && onSelectPgn(customPgn, customColor)}
                  disabled={!customPgn.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all disabled:opacity-40"
                >
                  Analyze PGN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
