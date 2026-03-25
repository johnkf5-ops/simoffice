/**
 * SimOffice Powers — Built from scratch. No ClawX UI.
 * Dark buddy panel + skills management matching SimOffice design.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSkillsStore } from '@/stores/skills';
import { BuddyPanel } from '@/components/common/BuddyPanel';

export function LobbyPowers() {
  const navigate = useNavigate();
  const skills = useSkillsStore((s) => s.skills);
  const loading = useSkillsStore((s) => s.loading);
  const fetchSkills = useSkillsStore((s) => s.fetchSkills);
  const enableSkill = useSkillsStore((s) => s.enableSkill);
  const disableSkill = useSkillsStore((s) => s.disableSkill);

  useEffect(() => { void fetchSkills(); }, [fetchSkills]);

  const handleToggle = async (skillId: string, currentlyEnabled: boolean) => {
    try {
      if (currentlyEnabled) {
        await disableSkill(skillId);
      } else {
        await enableSkill(skillId);
      }
    } catch { /* error handled by store */ }
  };

  const enabledCount = skills.filter((s) => s.enabled).length;

  // Sort: English skills first, then non-English
  const isEnglish = (text: string) => /^[\x00-\x7F]*$/.test(text);
  const sortedSkills = [...skills].sort((a, b) => {
    const aEng = isEnglish(a.description || '');
    const bEng = isEnglish(b.description || '');
    if (aEng && !bEng) return -1;
    if (!aEng && bEng) return 1;
    // Then enabled first
    if (a.enabled && !b.enabled) return -1;
    if (!a.enabled && b.enabled) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return (
    <div style={{ display: 'flex', height: '100%' }}>

      {/* ═══ BUDDY PANEL ═══ */}
      <BuddyPanel currentPage="/powers" />

      {/* ═══ CONTENT AREA ═══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>

        {/* Section Header */}
        <div style={{
          padding: '32px 40px 24px 40px',
          background: 'linear-gradient(135deg, #e11d48 0%, #fb7185 50%, #fda4af 100%)',
        }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            ← Back to Lobby
          </button>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
            Skills
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontFamily: 'Inter, sans-serif' }}>
            Manage your AI's abilities
          </p>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 40px 40px' }}>

          {/* Stats bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))',
              background: 'hsl(var(--muted))', padding: '6px 14px', borderRadius: 8,
            }}>
              {enabledCount} active / {skills.length} total
            </div>
          </div>

          {loading && skills.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'hsl(var(--muted-foreground))' }}>
              Loading skills...
            </div>
          )}

          {!loading && skills.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: 'hsl(var(--foreground))' }}>
                No skills found
              </div>
              <div style={{ fontSize: 14, color: 'hsl(var(--muted-foreground))', marginTop: 6 }}>
                Skills will appear here once the engine is running
              </div>
            </div>
          )}

          {/* Skills Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {sortedSkills.map((skill) => (
              <div key={skill.id}
                style={{
                  background: 'hsl(var(--card))',
                  border: `1px solid ${skill.enabled ? 'rgba(225,29,72,0.25)' : 'hsl(var(--border))'}`,
                  borderRadius: 14,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'all 0.2s',
                  opacity: skill.enabled ? 1 : 0.65,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 3px 16px rgba(225,29,72,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Icon */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: skill.enabled
                      ? 'linear-gradient(135deg, #e11d48, #fb7185)'
                      : 'hsl(var(--muted))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {skill.icon || '📦'}
                  </div>

                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif',
                      color: 'hsl(var(--foreground))',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {skill.name}
                    </div>
                    {skill.version && (
                      <div style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>
                        v{skill.version}
                        {skill.author && ` by ${skill.author}`}
                      </div>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(skill.id, skill.enabled)}
                    disabled={skill.isCore}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none',
                      cursor: skill.isCore ? 'default' : 'pointer',
                      background: skill.enabled
                        ? 'linear-gradient(135deg, #e11d48, #fb7185)'
                        : 'hsl(var(--muted))',
                      position: 'relative',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                    title={skill.isCore ? 'Core skill — always on' : (skill.enabled ? 'Turn off' : 'Turn on')}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'white',
                      position: 'absolute',
                      top: 3,
                      left: skill.enabled ? 23 : 3,
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                {/* Description */}
                <div style={{
                  fontSize: 12, color: 'hsl(var(--muted-foreground))',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {skill.description || 'No description available'}
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {skill.isCore && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#e11d48',
                      background: 'rgba(225,29,72,0.1)', padding: '2px 8px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                      Core
                    </span>
                  )}
                  {skill.isBundled && !skill.isCore && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: 'hsl(var(--muted-foreground))',
                      background: 'hsl(var(--muted))', padding: '2px 8px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                      Built-in
                    </span>
                  )}
                  {skill.source === 'openclaw-managed' && !skill.isBundled && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#0d9488',
                      background: 'rgba(13,148,136,0.1)', padding: '2px 8px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                      Installed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
