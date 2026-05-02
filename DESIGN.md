# SIEM Dashboard - Design Brief

> Design system de reference. Source d'inspiration principale : linear.app.
> A utiliser comme entree pour Claude Design (et tout agent design IA).
> A lire en parallele de PROJECT.md.

## 1. Philosophie

Linear est la reference 2025 pour les apps de productivite. Le dashboard
SIEM doit appliquer la meme philosophie au monitoring de securite :

- **Densite controlee** : un analyste passe 4h/jour dans l'outil. Chaque
  pixel doit etre utile. Pas de white space marketing, pas de hero sections.
- **Dark first, vraiment** : pas un dark mode bricole sur un design pense
  light. Tout est concu pour le sombre, le clair viendra plus tard.
- **Vitesse percue** : transitions courtes (150-200ms), skeletons immediats,
  optimistic updates, pas de spinner plein ecran.
- **Clavier d'abord** : raccourcis partout, command palette (Cmd+K), nav
  fleches dans les listes. Comme Linear.
- **Hierarchie par typographie et opacite**, pas par couleur. La couleur
  est reservee aux signaux (severite, status, accent).

## 2. Tokens

### Couleurs (mode sombre)

```typescript
// tailwind.config.ts - extend.colors
const colors = {
  // Surfaces
  bg: {
    canvas:    '#08090a',  // fond principal de la page
    surface:   '#0f1011',  // cards, panels
    elevated:  '#16181a',  // popover, modal, command palette
    hover:     '#1c1e21',  // ligne survolee
    selected:  '#22252a',  // ligne active/selectionnee
  },

  // Bordures
  border: {
    subtle:    '#1f2124',  // separateurs internes
    default:   '#2a2d31',  // bordures de cards
    strong:    '#3a3e44',  // focus rings
  },

  // Texte (par opacite, plus lisible que par teinte)
  fg: {
    default:   '#e6e6e6',  // texte principal (90% blanc)
    muted:     '#9ba1a6',  // labels, meta (60%)
    subtle:    '#6e7479',  // hints, placeholders (40%)
    disabled:  '#4a4e54',  // disabled (25%)
  },

  // Accent (indigo Linear-like)
  accent: {
    DEFAULT:   '#5e6ad2',
    hover:     '#6f7be0',
    active:    '#4f5bc4',
    bg:        '#5e6ad21a',  // 10% opacity background
    border:    '#5e6ad24d',  // 30% opacity border
  },

  // Severite (alertes Wazuh)
  severity: {
    info:      '#4d9fec',  // niveau 1-3
    low:       '#5fb37c',  // niveau 4-6
    medium:    '#e8b339',  // niveau 7-9
    high:      '#e8704a',  // niveau 10-12
    critical:  '#dc4040',  // niveau 13-15
  },

  // Status agents
  status: {
    active:        '#5fb37c',  // green
    disconnected:  '#9ba1a6',  // gray
    pending:       '#e8b339',  // amber
    never:         '#6e7479',  // dim
  },
}
```

Usage : JAMAIS de hex en dur dans les composants. Toujours via Tailwind
(`bg-bg-canvas`, `text-fg-muted`, `border-border-subtle`, etc.).

### Typographie

```
Font family principale : Inter (variable, latin + latin-ext)
Font monospace        : JetBrains Mono (code, IDs, hashes)

Type scale (rem):
  xs    : 0.75rem  / 12px   // labels, badges, captions
  sm    : 0.8125rem / 13px  // body dense (tables, listes)
  base  : 0.875rem / 14px   // body standard
  md    : 1rem     / 16px   // titre de panel
  lg    : 1.125rem / 18px   // titre de page
  xl    : 1.5rem   / 24px   // KPIs
  2xl   : 2rem     / 32px   // KPI hero (rare)

Line height : 1.4 partout sauf headings (1.2)
Letter spacing : -0.01em sur titres, 0 sur body, +0.02em sur uppercase

Weights utilises : 400 (body), 500 (labels, buttons), 600 (titres),
                   700 reserve pour KPIs et logos.
                   PAS de 800 ni 900.
```

### Espacements (echelle 4px)

```
0    : 0
0.5  : 2px
1    : 4px
1.5  : 6px
2    : 8px
3    : 12px
4    : 16px
5    : 20px
6    : 24px
8    : 32px
10   : 40px
12   : 48px
16   : 64px
```

Regles :
- Padding cards : `p-4` standard, `p-6` pour les panels importants.
- Padding cellules table : `px-3 py-2` (dense).
- Gap horizontal entre icone et texte : `gap-2` (8px).
- Gap vertical entre items de liste : `gap-1` (4px) en dense, `gap-2` sinon.

### Radius

```
sm   : 6px   // badges, inputs
md   : 8px   // boutons, cards petites
lg   : 12px  // cards principales, panels, modals
xl   : 16px  // hero cards (rare)
full : 9999  // avatars, pills de status
```

Pas de `rounded-2xl`, `rounded-3xl`, jamais.

### Ombres

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 12px rgba(0,0,0,0.4);
--shadow-lg: 0 12px 32px rgba(0,0,0,0.5);
```

3 niveaux maximum. Les ombres sont SUBTILES, pas marketing. La hierarchie
vient surtout des bordures et de la couleur de surface.

### Animations

```
Duration  : 150ms (interactions petites), 200ms (panels, modals)
Easing    : cubic-bezier(0.4, 0.0, 0.2, 1)  // ease-out
Stagger   : 30ms entre items d'une liste qui apparait
```

Framer Motion pour les transitions complexes (slide-over, modal, page).
CSS transitions pour les hover states.

JAMAIS de spring bouncy. JAMAIS de delay > 200ms. JAMAIS d'animation qui
joue plus d'une fois sans interaction.

## 3. Composants

### Sidebar (gauche, 240px, pliable a 56px)

```
+------------------------+
|  [Logo]  SIEM         |  <- 48px de haut, separateur subtle dessous
+------------------------+
|  > Workspace          |  <- nom du Wazuh Manager, dropdown si plusieurs
+------------------------+
|  [O] Overview         |  <- icone 16px + label, hover bg-bg-hover
|  [#] Agents           |
|  [!] Alerts      4    |  <- badge si non lus
|  [%] Rules            |
|  [T] Timeline         |
+------------------------+
|  ----                 |  <- separateur
|  [c] Settings         |
|  [u] Users            |  <- visible pour admin uniquement
+------------------------+
|  [@avatar] matthieu   |  <- en bas, popover sur clic (logout, profil)
+------------------------+
```

Caracteristiques :
- Pliable via raccourci Cmd+B ou bouton en bas.
- Persistante : ouverte/fermee sauve dans localStorage.
- Item actif : bg-bg-selected + bordure gauche 2px accent.
- Item hover : bg-bg-hover, transition 150ms.
- Icones lucide-react, taille 16.

### Topbar (haut, 48px)

```
+----------------------------------------------------------+
| [breadcrumb]  Alerts > Detail #4521          [Cmd+K] [@] |
+----------------------------------------------------------+
```

Contenu :
- Gauche : breadcrumb compact, separateur `chevron-right` 12px.
- Droite : raccourci Cmd+K visible, avatar/menu utilisateur, bouton
  notifications (cloche avec badge si alertes critiques non lues).
- Pas de logo (deja dans la sidebar).
- Hauteur 48px, separateur en bas border-subtle.

### Cards

```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 16px 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.card-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--fg-default);
  font-variant-numeric: tabular-nums;
}
```

### Boutons

```
Variants :
  primary    : bg-accent text-white, hover bg-accent-hover
  secondary  : bg-bg-elevated border-border-default, hover bg-bg-hover
  ghost      : transparent, hover bg-bg-hover
  destructive: bg-severity-critical text-white
  danger-ghost: text-severity-critical, hover bg-severity-critical/10

Sizes :
  sm  : px-2.5 py-1   text-xs    height 28px
  md  : px-3   py-1.5 text-sm    height 32px  (default)
  lg  : px-4   py-2   text-base  height 40px

Icone seule : aspect-square, padding equivalent au size.
Icone + texte : gap-2, icone 16px.
```

Toujours focus ring : `ring-2 ring-accent ring-offset-2 ring-offset-bg-canvas`.

### Inputs

```
Background  : bg-bg-elevated
Border      : 1px solid border-default
Focus       : border-accent + ring-2 ring-accent/30 (sans offset)
Padding     : px-3 py-1.5
Height      : 32px (md), 40px (lg)
Radius      : 6px
Placeholder : text-fg-subtle
Label       : text-xs text-fg-muted, mb-1.5
Helper text : text-xs text-fg-subtle, mt-1
Error       : border-severity-critical, helper text severity-critical
```

### Tables (le composant le plus important)

```
+------+----------------+--------+----------+----------+--------+
| []   | Agent          | OS     | Status   | Last     | ...    |
+------+----------------+--------+----------+----------+--------+
| []   | mac-mat        | macOS  | [.]Active| 2m ago   | [...]  |
| []   | win-mat-pc     | Win11  | [.]Active| 1m ago   | [...]  |
| []   | rpi-mat-site   | Linux  | [.]Active| 5s ago   | [...]  |
| []   | wazuh-server   | Linux  | [.]Active| 3s ago   | [...]  |
+------+----------------+--------+----------+----------+--------+

Header :
  - bg-bg-canvas, sticky top-0
  - text-xs text-fg-muted uppercase tracking-wide
  - border-b border-border-default
  - hauteur 36px, padding px-3
  - tri : icone fleche au survol, persistante si actif

Body :
  - hauteur ligne 36px (compacte) ou 44px (confortable, toggle)
  - hover bg-bg-hover (toute la ligne)
  - selected bg-bg-selected
  - border-b border-border-subtle entre lignes (PAS de full border)
  - padding cellules px-3 py-2

Cellules speciales :
  - Status pill : background severite/12 + text severite, radius full
  - Timestamp : text-fg-muted, format relatif (2m ago) + tooltip absolu
  - Actions : icone DotsHorizontal, dropdown au clic
  - Selection : checkbox shadcn dans premiere colonne

Pagination :
  - Bas du tableau, separator au-dessus
  - "Showing 1-50 of 1,247" a gauche en text-fg-muted
  - Boutons Previous/Next a droite
  - Pas de jump-to-page, c'est du scroll virtualise pour > 1000 lignes
```

### Severity badge (alertes)

Compact, lisible d'un coup d'oeil :

```jsx
<Badge severity={alert.level}>
  {alert.level}  // ou label : "Low", "Medium", "High", "Critical"
</Badge>

// Mapping :
1-3   -> info     bg-severity-info/15 text-severity-info
4-6   -> low      bg-severity-low/15 text-severity-low
7-9   -> medium   bg-severity-medium/15 text-severity-medium
10-12 -> high     bg-severity-high/15 text-severity-high
13-15 -> critical bg-severity-critical/20 text-severity-critical
```

### Slide-over (detail d'alerte)

Quand on clique sur une alerte dans la liste :

```
                                         +-------------------+
                                         | < Back   #4521 [x]|
                                         +-------------------+
                                         | [Critical] Level 13|
                                         | Brute force on SSH |
                                         +-------------------+
                                         | Agent  : mac-mat   |
                                         | Rule   : 5712      |
                                         | Time   : 2m ago    |
                                         | Source : 51.x.x.x  |
                                         +-------------------+
                                         | Description ...    |
                                         | ...                |
                                         +-------------------+
                                         | Tags  [+]          |
                                         | [brute] [ssh]      |
                                         +-------------------+
                                         | Notes              |
                                         | [textarea]         |
                                         +-------------------+
                                         | [Acknowledge]      |
                                         +-------------------+
```

Caracteristiques :
- Slide depuis la droite, largeur 480px (640px en xl).
- Backdrop blur subtle sur le contenu derriere.
- Fermeture : Esc, clic backdrop, bouton X.
- Animation 200ms ease-out.
- Header sticky avec bouton back (si workflow imbrique).

### Command palette (Cmd+K)

Inspiree directement de Linear et Raycast :

```
+------------------------------------------------+
|  [search] Search or type a command...          |
+------------------------------------------------+
| Recent                                         |
|  [O] Go to Agents                              |
|  [!] View critical alerts last 24h             |
+------------------------------------------------+
| Navigation                                     |
|  [O] Overview                          o       |
|  [#] Agents                            g a     |
|  [!] Alerts                            g e     |
|  [%] Rules                             g r     |
+------------------------------------------------+
| Actions                                        |
|  [+] Invite a user                             |
|  [c] Refresh data                       r      |
|  [d] Toggle dense mode                  shift+d|
+------------------------------------------------+
```

Centree, max-width 600px, max-height 400px scrollable.
Fuzzy search via cmdk lib (utilisee par shadcn).

### Empty states

Toujours informer + proposer une action :

```
+----------------------------+
|                            |
|        [icon 48px]         |
|                            |
|   Aucune alerte critique   |
|                            |
|   Tout est calme.          |
|   Bonne nouvelle.          |
|                            |
|   [View all alerts]        |
|                            |
+----------------------------+
```

Tone : direct, sobre, jamais "joyeux IA". Pas d'emoji.

### Error states

```
[!] Connection lost
    Cannot reach the Wazuh API.
    Last successful sync : 2m ago.

    [Retry]  [Show details]
```

Couleur severity-medium pour erreurs reseau, severity-critical pour erreurs
backend. Toujours proposer une action.

### Loading states

Skeletons (pas de spinners) :

```jsx
<div className="space-y-2">
  <Skeleton className="h-9" />  // ligne de table
  <Skeleton className="h-9" />
  <Skeleton className="h-9" />
</div>
```

Skeleton = `animate-pulse bg-bg-elevated rounded`. Tres subtil, pas
clignotant.

Spinner uniquement pour les boutons en cours d'action :

```jsx
<Button disabled>
  <Loader2 className="h-4 w-4 animate-spin" />
  Connecting...
</Button>
```

## 4. Vues du dashboard

### / (Overview)

```
+-------------+ +-------------+ +-------------+ +-------------+
| AGENTS      | | ALERTS 24H  | | CRITICAL 7D | | UP TIME     |
|     4       | |    127      | |      3      | |   99.2%     |
| 4 active    | | +12% vs J-1 | | -1 vs S-1   | | last 30d    |
+-------------+ +-------------+ +-------------+ +-------------+

+----------------------------------+ +-------------------------+
| ALERTS BY SEVERITY (last 7 days) | | TOP RULES               |
| [stacked area chart]             | | 5712 SSH brute    87    |
|                                  | | 5503 PAM auth     45    |
|                                  | | 5402 sudo failed  23    |
+----------------------------------+ +-------------------------+

+--------------------------------------------------------------+
| RECENT CRITICAL ALERTS                          [View all >] |
+--------------------------------------------------------------+
| [Critical] Brute force SSH       mac-mat       2m ago        |
| [Critical] Modified sshd_config  rpi-site      14m ago       |
| [High]     Failed sudo x10       win-mat-pc    1h ago        |
+--------------------------------------------------------------+
```

KPIs en haut : 4 cards 1/4 width chacune, hauteur fixe 100px.
Chart principal : largeur 2/3, droite top rules 1/3.
Liste alertes recentes en bas, full width, max 5 entrees.

Refresh auto toutes les 30s, indicator subtil en topbar (point vert qui
pulse 1x toutes les 30s).

### /agents

Table dense des agents avec :
- Colonnes : checkbox, name, OS (avec icone), version Wazuh, IP, status,
  groupe, last keep alive, actions.
- Filtres en topbar de la vue : status (multi-select), OS (multi-select),
  groupe, search par nom/IP.
- Bulk actions si selection : redemarrer agent, ajouter au groupe, supprimer.
- Clic sur ligne -> /agents/:id (page detail full).

### /agents/:id

```
+--- Header ---+
| < mac-mat                                    [Restart] [Remove]|
| macOS 14.5 - 192.168.100.5 - active 3s ago                    |
+----------------+---------------------+------------+
| Overview       | Alerts (last 7d)    | Files (FIM)|
| Vulnerabilities| MITRE ATT&CK        | Rootcheck  |
+----------------+---------------------+------------+
[contenu de l'onglet]
```

Tabs en haut, contenu en dessous. Onglets par defaut : Overview, Alerts,
FIM, Vulnerabilities, MITRE, SCA, Logs.

### /alerts

LE coeur du dashboard. Trois zones :

```
+----------------+---------------------------------------+
| FILTERS        | ALERTS STREAM         [pause] [export]|
| Time range     |                                       |
|  [Last 24h v]  | [Critical] #4521 ... mac-mat   2m ago |
| Severity       | [High]     #4520 ... rpi-site  3m ago |
|  [x] critical  | [Medium]   #4519 ... mac-mat   5m ago |
|  [x] high      | ...                                   |
|  [ ] medium    |                                       |
|  [ ] low       |                                       |
| Agents         |                                       |
|  [Search...]   |                                       |
| Rules          |                                       |
|  [Search...]   |                                       |
| Tags           |                                       |
|  [brute] [+]   |                                       |
+----------------+---------------------------------------+
```

Sidebar gauche de filtres : 240px, pliable.
Stream temps reel via WebSocket, indicator "live" en haut a droite (point
vert qui pulse + texte "Live").
Bouton "Pause" pour figer le flux pendant analyse.
Export : JSON ou CSV des alertes filtrees.

Clic sur alerte -> ouvre slide-over detail (pas de page navigation).

### /rules

Table des regles Wazuh avec :
- Colonnes : ID, level, description, group, fired count (7d), last fired.
- Filtres : level, group, search.
- Clic -> page detail regle (definition XML, statistiques, alertes recentes).

### /timeline

Vue chronologique des events sur 24h/7j/30j :

```
+------------------------------------------------------+
| <  [Last 24h v]  [All severities v]  [All agents v]  |
+------------------------------------------------------+
|  00:00     06:00     12:00     18:00     00:00      |
|  |---------------------------------------------|     |
|     . .       ...     . .   .  ...   .....    .     |
|       o            ooo                  oo     o    | <- critical
|        ::  :: :    : :::: : :  :: :: : ::::  ::: : | <- high
|     ::: :::::::::::::::::::::::::::::::::::::::::: | <- medium
+------------------------------------------------------+
| Selection 18:42 - 19:15  -> 23 alerts                |
| [Critical] x2  [High] x5  [Medium] x16               |
| [List below]                                          |
+------------------------------------------------------+
```

Chart custom (recharts ou D3 minimal). Selection brush pour zoomer sur une
plage, qui ouvre la liste filtree en bas.

### /settings

Sections en sidebar interne :
- Profile (email, password, MFA, theme)
- Workspace (Wazuh API config, refresh interval)
- Users (admin uniquement) : liste, invites, roles
- Tags (gestion tags custom)
- Audit log (admin uniquement)
- About (version, link GitHub, license)

### /login

Centre vertical+horizontal, card 360px de large :

```
              +---------------------+
              |   [logo]            |
              |   SIEM Dashboard    |
              +---------------------+
              | Email               |
              | [____________]      |
              | Password            |
              | [____________]      |
              |                     |
              | [    Sign in    ]   |
              +---------------------+
              | Forgot password ?   |
              +---------------------+
```

Background : `bg-bg-canvas`. Pas d'image marketing, pas de gradient.
Card en `bg-bg-surface` avec radius lg.

Si MFA active, second ecran : champ TOTP (6 chiffres, autofocus).

### /invite/:token

Meme layout que /login mais :
- Header : "You've been invited as <role>"
- Champs : email (preremp+disabled), password, confirm password.
- Indicator de force du mot de passe.
- Bouton : "Create account".

## 5. Etats responsives

### Desktop (default)
Layout complet sidebar + main + slide-over.

### Tablet (< 1024px)
Sidebar cachee par defaut, accessible via burger.
Slide-over devient bottom-sheet.

### Mobile (< 640px)
Topbar simplifiee.
Liste alertes en cards verticales (pas table).
Filtres dans drawer.
KPIs en pile verticale.

> Le mobile est secondaire mais fonctionnel pour consultation rapide en
> deplacement. La saisie complexe (gestion users, etc.) reste desktop.

## 6. Accessibilite

- Contraste WCAG AA minimum sur tous les couples texte/fond.
- Focus rings visibles (jamais `outline-none` sans alternative).
- Tab order logique partout.
- Raccourcis clavier documentes dans `?` (overlay help).
- ARIA roles corrects sur les composants custom.
- Ne pas dependre de la couleur seule pour transmettre l'info (toujours
  doublee par texte/icone).

## 7. Iconographie

`lucide-react` exclusivement. Tailles :
- 14px : inline avec text-xs/sm
- 16px : icones de bouton, sidebar, table
- 20px : icones d'header de section
- 24px : icones d'empty state ou de nav principale

Stroke width par defaut (1.5). Jamais d'icone bold ou filled, sauf pour
les status pills (cercle plein vs cercle vide).

Mapping standardise pour ce dashboard :

```
Overview   : LayoutDashboard
Agents     : Server
Alerts     : Bell
Rules      : Filter
Timeline   : LineChart
Settings   : Settings
Users      : Users
Tags       : Tag
Search     : Search
Critical   : AlertTriangle
Active     : CheckCircle2
Inactive   : Circle
Filter     : SlidersHorizontal
Export     : Download
Refresh    : RefreshCw
Pause      : Pause
Play       : Play
More       : MoreHorizontal
Menu       : Menu
Close      : X
```

## 8. Branding minimal

- Nom du produit : SIEM Dashboard (placeholder, a renommer apres MVP).
- Logo : monogramme 2 lettres `SD` dans un carre rounded-lg accent. Pas
  de logo marketing.
- Tagline (sous le logo dans /login) : "Lightweight Wazuh interface".
- Couleur d'accent reprise de Linear (#5e6ad2). Si on rebrand : choisir
  une nuance qui contraste bien avec les couleurs de severite.

## 9. Reference visuelle

Avant tout commit qui touche au visuel, verifier mentalement :

1. **Linear.app** est ouvert -> est-ce que ce composant pourrait y etre
   sans choquer ? Si non, ajuster.
2. **Vercel dashboard** -> meme test.
3. **Posthog** -> idem pour les charts et les vues data-heavy.

Si une decision doit etre prise et qu'elle sort du scope de ce document,
le defaut est :
> "Que ferait Linear ?"

## 10. Anti-patterns a refuser

- Gradients sur boutons (sauf cas exceptionnel valide).
- Glassmorphism partout (subtil sur slide-over OK, jamais sur cards).
- Animations bouncy.
- Skeumorphism (boutons avec ombres internes, etc.).
- Couleurs vives en surface large (un fond bleu plein, jamais).
- Texte centre dans des paragraphes.
- Police plus de 2 familles (Inter + JetBrains Mono, c'est tout).
- Plus de 3 niveaux d'ombre.
- Border-radius incoherents entre composants.
- Spacing arbitraires hors echelle.
- Couleur seule pour signifier (ex : ligne rouge sans icone alert).

## 11. Livrables design

Pour chaque vue, l'agent design doit produire :

1. Description textuelle du layout (zones, hierarchie, priorites visuelles).
2. Liste des composants utilises (avec source : shadcn ou custom).
3. Wireframe en ASCII art (comme dans ce document) ou en SVG/React.
4. Etats : default, loading, empty, error, hover, selected, disabled.
5. Comportements responsives : desktop / tablet / mobile.
6. Raccourcis clavier specifiques.
7. Accessibilite : roles ARIA, ordre tab, annonces screen reader.

Ces livrables vont dans `docs/design/<vue>.md` et servent de spec a
Claude Code pour l'implementation.

---

> En cas de doute, le principe directeur reste : "Linear, mais pour la
> securite". Densite, vitesse, sobriete, clavier. Tout le reste decoule.
