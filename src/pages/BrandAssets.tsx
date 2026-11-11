import React, { useState } from 'react';
import { Logo, MamaRootEmblem } from '../components/Logo';
import { Download, ArrowLeft, ShieldCheck, Palette, FileImage, Copy, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BrandAssets() {
  const navigate = useNavigate();
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const colors = [
    { name: 'Warm Ivory (Background)', hex: '#FFF9F3', role: 'Primary application background & clean spacious areas', border: true },
    { name: 'Soft Blush (Secondary)', hex: '#F4E8E0', role: 'Card backgrounds, secondary surfaces & panels' },
    { name: 'Dusty Rose (Accent)', hex: '#D9A7A4', role: 'Secondary highlights, icons & subtle decorative elements' },
    { name: 'Berry (Interactive & Buttons)', hex: '#914E61', role: 'Primary buttons, active tabs, interactive highlights' },
    { name: 'Deep Plum (Primary Brand)', hex: '#572D43', role: 'Primary navigation, headings, strong brand elements' },
    { name: 'Dark Charcoal (Body Text)', hex: '#302B2D', role: 'Readable body text, primary interface labels' },
    { name: 'Muted Grey (Supporting Text)', hex: '#777078', role: 'Secondary text, metadata, subtle labels' },
    { name: 'White', hex: '#FFFFFF', role: 'Content cards, forms, modals & elevated surfaces', border: true },
  ];

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const getSvgString = (bg: string, iconStroke: string, textFill: string) => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 140" width="560" height="140">
      <rect width="560" height="140" rx="28" fill="${bg}"/>
      <g transform="translate(32, 22)">
        <rect width="96" height="96" rx="26" fill="#572D43"/>
        <g transform="translate(14, 14) scale(0.68)">
          <circle cx="50" cy="50" r="46" stroke="rgba(217, 167, 164, 0.22)" stroke-width="1.2" stroke-dasharray="3 3"/>
          <path d="M50 7 C47 13 47 19 50 24 C53 19 53 13 50 7 Z" fill="#D9A7A4" fill-opacity="0.95"/>
          <path d="M48 16 C41 12 34 14 31 20 C36 22 43 21 48 18 Z" fill="#D9A7A4" fill-opacity="0.85"/>
          <path d="M52 16 C59 12 66 14 69 20 C64 22 57 21 52 18 Z" fill="#D9A7A4" fill-opacity="0.85"/>
          <path d="M46 25 C37 20 28 22 23 29 C29 32 38 30 46 27 Z" fill="#D9A7A4" fill-opacity="0.85"/>
          <path d="M54 25 C63 20 72 22 77 29 C71 32 62 30 54 27 Z" fill="#D9A7A4" fill-opacity="0.85"/>
          <path d="M44 33 C34 30 24 35 20 43 C26 44 36 41 43 36 Z" fill="#D9A7A4" fill-opacity="0.8"/>
          <path d="M56 33 C66 30 76 35 80 43 C74 44 64 41 57 36 Z" fill="#D9A7A4" fill-opacity="0.8"/>
          <path d="M50 24 C44 26 36 29 27 34" stroke="${iconStroke}" stroke-width="2" stroke-linecap="round"/>
          <path d="M50 24 C56 26 64 29 73 34" stroke="${iconStroke}" stroke-width="2" stroke-linecap="round"/>
          <circle cx="50" cy="27" r="3.2" fill="#F4E8E0"/>
          <ellipse cx="50" cy="46" rx="5.5" ry="6.5" fill="#D9A7A4" fill-opacity="0.35"/>
          <circle cx="50" cy="46" r="2.2" fill="#F4E8E0"/>
          <path d="M46.5 32 C44 37 43 43 45 49 C46.5 53 48.5 56 47 62" stroke="${iconStroke}" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M53.5 32 C56 37 57 43 55 49 C53.5 53 51.5 56 53 62" stroke="${iconStroke}" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M50 31 V41 M50 51 V62" stroke="${iconStroke}" stroke-width="2" stroke-linecap="round"/>
          <path d="M38 62 C44 63.5 56 63.5 62 62" stroke="#D9A7A4" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.7"/>
          <path d="M50 62 C50 71 49 81 50 94" stroke="${iconStroke}" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M50 73 C48 78 45 84 44 91" stroke="${iconStroke}" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M50 75 C52 80 55 86 56 91" stroke="${iconStroke}" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M47 62 C41 66 32 70 23 72 C18 73 14 74 10 77" stroke="${iconStroke}" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M35 68 C31 75 25 82 17 87" stroke="#D9A7A4" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M42 70 C38 78 34 85 30 92" stroke="${iconStroke}" stroke-width="1.7" stroke-linecap="round"/>
          <path d="M24 78 C20 82 15 85 11 88" stroke="#D9A7A4" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M53 62 C59 66 68 70 77 72 C82 73 86 74 90 77" stroke="${iconStroke}" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M65 68 C69 75 75 82 83 87" stroke="#D9A7A4" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M58 70 C62 78 66 85 70 92" stroke="${iconStroke}" stroke-width="1.7" stroke-linecap="round"/>
          <path d="M76 78 C80 82 85 85 89 88" stroke="#D9A7A4" stroke-width="1.3" stroke-linecap="round"/>
        </g>
      </g>
      <text x="148" y="66" font-family="'Outfit', 'Inter', -apple-system, sans-serif" font-weight="700" font-size="38" letter-spacing="-0.03em" fill="${textFill}">Mama<tspan fill="#914E61">Root</tspan></text>
      <rect x="340" y="45" width="48" height="22" rx="6" fill="#F4E8E0"/>
      <text x="364" y="60" font-family="'Inter', sans-serif" font-weight="700" font-size="11" fill="#572D43" text-anchor="middle" letter-spacing="0.08em">CARE</text>
      <text x="148" y="96" font-family="'Inter', -apple-system, sans-serif" font-weight="500" font-size="13" fill="#777078" letter-spacing="-0.01em">The Mother's Guide • The Doctor's Assistant</text>
    </svg>`;
  };

  const getMarkSvgString = () => {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect width="160" height="160" rx="36" fill="#572D43"/>
      <g transform="translate(30, 30)">
        <circle cx="50" cy="50" r="46" stroke="rgba(217, 167, 164, 0.22)" stroke-width="1.2" stroke-dasharray="3 3"/>
        <path d="M50 7 C47 13 47 19 50 24 C53 19 53 13 50 7 Z" fill="#D9A7A4" fill-opacity="0.95"/>
        <path d="M48 16 C41 12 34 14 31 20 C36 22 43 21 48 18 Z" fill="#D9A7A4" fill-opacity="0.85"/>
        <path d="M52 16 C59 12 66 14 69 20 C64 22 57 21 52 18 Z" fill="#D9A7A4" fill-opacity="0.85"/>
        <path d="M46 25 C37 20 28 22 23 29 C29 32 38 30 46 27 Z" fill="#D9A7A4" fill-opacity="0.85"/>
        <path d="M54 25 C63 20 72 22 77 29 C71 32 62 30 54 27 Z" fill="#D9A7A4" fill-opacity="0.85"/>
        <path d="M44 33 C34 30 24 35 20 43 C26 44 36 41 43 36 Z" fill="#D9A7A4" fill-opacity="0.8"/>
        <path d="M56 33 C66 30 76 35 80 43 C74 44 64 41 57 36 Z" fill="#D9A7A4" fill-opacity="0.8"/>
        <path d="M50 24 C44 26 36 29 27 34" stroke="#FFF9F3" stroke-width="2" stroke-linecap="round"/>
        <path d="M50 24 C56 26 64 29 73 34" stroke="#FFF9F3" stroke-width="2" stroke-linecap="round"/>
        <circle cx="50" cy="27" r="3.2" fill="#F4E8E0"/>
        <ellipse cx="50" cy="46" rx="5.5" ry="6.5" fill="#D9A7A4" fill-opacity="0.35"/>
        <circle cx="50" cy="46" r="2.2" fill="#F4E8E0"/>
        <path d="M46.5 32 C44 37 43 43 45 49 C46.5 53 48.5 56 47 62" stroke="#FFF9F3" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M53.5 32 C56 37 57 43 55 49 C53.5 53 51.5 56 53 62" stroke="#FFF9F3" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M50 31 V41 M50 51 V62" stroke="#FFF9F3" stroke-width="2" stroke-linecap="round"/>
        <path d="M38 62 C44 63.5 56 63.5 62 62" stroke="#D9A7A4" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.7"/>
        <path d="M50 62 C50 71 49 81 50 94" stroke="#FFF9F3" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M50 73 C48 78 45 84 44 91" stroke="#FFF9F3" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M50 75 C52 80 55 86 56 91" stroke="#FFF9F3" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M47 62 C41 66 32 70 23 72 C18 73 14 74 10 77" stroke="#FFF9F3" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M35 68 C31 75 25 82 17 87" stroke="#D9A7A4" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M42 70 C38 78 34 85 30 92" stroke="#FFF9F3" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M24 78 C20 82 15 85 11 88" stroke="#D9A7A4" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M53 62 C59 66 68 70 77 72 C82 73 86 74 90 77" stroke="#FFF9F3" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M65 68 C69 75 75 82 83 87" stroke="#D9A7A4" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M58 70 C62 78 66 85 70 92" stroke="#FFF9F3" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M76 78 C80 82 85 85 89 88" stroke="#D9A7A4" stroke-width="1.3" stroke-linecap="round"/>
      </g>
    </svg>`;
  };

  const downloadSvg = () => {
    const svgContent = getSvgString('#FFF9F3', '#FFF9F3', '#572D43');
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mama-root-logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadMarkSvg = () => {
    const svgContent = getMarkSvgString();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mama-root-emblem-roots.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const svgContent = getSvgString('#FFF9F3', '#FFF9F3', '#572D43');
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1120; // 2x resolution
      canvas.height = 280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1120, 280);
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = 'mama-root-logo.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pngUrl);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-[#FFF9F3] p-6 lg:p-12 font-sans text-[#302B2D]">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-semibold text-[#777078] hover:text-[#572D43] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>

      <div className="max-w-5xl mx-auto space-y-10">
        <header>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4E8E0] text-[#572D43] text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#914E61]" />
            <span>Mama Root Modern Heritage Identity</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#572D43]">
            Modern Heritage Visual System & Assets
          </h1>
          <p className="text-sm text-[#777078] mt-2 max-w-2xl leading-relaxed">
            Official emblem and deep roots mark for Mama Root, embodying culturally grounded African women's health, maternal strength, and ancestral grounding.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Logo Card & Downloads */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-8 border border-[#572D43]/10 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#F4E8E0] mb-6">
                <div>
                  <h2 className="text-sm font-bold text-[#572D43]">Official Logo & Emblem</h2>
                  <p className="text-[11px] text-[#777078]">Tree of Life, Maternal Silhouette & Deep Roots</p>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F4E8E0] text-[#572D43]">
                  Ready to Download
                </span>
              </div>

              {/* Logo Preview */}
              <div className="p-8 bg-[#FFF9F3] rounded-2xl border border-[#D9A7A4]/40 flex items-center justify-center mb-6">
                <Logo />
              </div>

              {/* Standalone Emblem Badge Preview */}
              <div className="p-6 bg-[#572D43] rounded-2xl border border-[#462235] flex items-center justify-center gap-6 mb-6">
                <div className="flex items-center justify-center">
                  <MamaRootEmblem size={56} isLight={true} />
                </div>
                <div className="text-left text-white">
                  <p className="text-xs font-bold tracking-wide">MAMA ROOT EMBLEM MARK</p>
                  <p className="text-[11px] text-[#D9A7A4] mt-0.5">Canopy • Maternal Core • Deep Roots Network</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#777078] leading-relaxed mb-6">
                <p>
                  <strong className="text-[#572D43]">Emblem Concept:</strong> The Tree of Life branches upwards with vibrant foliage while transforming into an embracing maternal silhouette. The base flows into deep, grounded taproots and anchoring root tendrils ("Roots").
                </p>
                <p>
                  <strong className="text-[#572D43]">Colors:</strong> Deep Plum (<code className="text-[#572D43] font-semibold">#572D43</code>), Berry (<code className="text-[#914E61] font-semibold">#914E61</code>), Dusty Rose (<code className="text-[#D9A7A4] font-semibold">#D9A7A4</code>), and Warm Ivory (<code className="text-[#914E61] font-semibold">#FFF9F3</code>).
                </p>
                <p>
                  <strong className="text-[#572D43]">Tagline:</strong> <em>The Mother's Guide • The Doctor's Assistant</em>
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={downloadPng}
                className="w-full btn-berry py-3 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <FileImage className="w-4 h-4" />
                <span>Download High-Res Logo PNG (1120×280)</span>
              </button>

              <button
                onClick={downloadSvg}
                className="w-full btn-secondary py-3 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Vector SVG</span>
              </button>

              <button
                onClick={downloadMarkSvg}
                className="w-full bg-[#FFF9F3] text-[#572D43] border border-[#D9A7A4] hover:bg-[#F4E8E0] py-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 text-[#914E61]" />
                <span>Download Emblem Badge SVG</span>
              </button>

              <div className="pt-2 flex items-center justify-between text-xs text-[#777078] border-t border-[#F4E8E0]">
                <span>Static file paths:</span>
                <div className="flex gap-3">
                  <a 
                    href="/mama-root-logo.svg" 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-mono text-[11px] text-[#914E61] hover:underline flex items-center gap-1"
                  >
                    /logo.svg <ExternalLink className="w-3 h-3" />
                  </a>
                  <a 
                    href="/mama-root-mark.svg" 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-mono text-[11px] text-[#914E61] hover:underline flex items-center gap-1"
                  >
                    /mark.svg <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Color System Tokens */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-8 border border-[#572D43]/10 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#F4E8E0] mb-6">
                <div>
                  <h2 className="text-sm font-bold text-[#572D43]">Modern Heritage Color System</h2>
                  <p className="text-[11px] text-[#777078]">Official hex values & UI assignments</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#914E61] font-medium">
                  <Palette className="w-4 h-4" />
                  <span>Click to copy</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => copyToClipboard(c.hex)}
                    className="text-left p-3.5 rounded-2xl bg-[#FFF9F3] border border-[#F4E8E0] hover:border-[#D9A7A4] transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div 
                        className={`w-9 h-9 rounded-xl shadow-2xs ${c.border ? 'border border-[#D9A7A4]/50' : ''}`}
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[10px] font-semibold text-[#777078] group-hover:text-[#572D43] flex items-center gap-1">
                        {copiedHex === c.hex ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#914E61]" />
                            <span className="text-[#914E61]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 opacity-60" />
                            <span>Copy</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#572D43]">{c.name.split(' (')[0]}</span>
                        <code className="text-[11px] font-mono font-semibold text-[#914E61]">{c.hex}</code>
                      </div>
                      <p className="text-[10px] text-[#777078] mt-1 leading-snug">{c.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#F4E8E0] text-xs text-[#777078] leading-relaxed">
              <p className="mb-2">
                <strong className="text-[#572D43]">Implementation Rule:</strong> These color tokens replace all previous sage-green styling across both the <em>Mother</em> wellness dashboard and the clinical <em>Doctor</em> workspace.
              </p>
              <div className="p-3 bg-[#F4E8E0]/60 rounded-xl text-[11px] text-[#572D43] flex items-center justify-between">
                <span>CSS Variables defined in <code>/src/index.css</code></span>
                <span className="font-semibold text-[#914E61]">--color-primary through --color-white</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
