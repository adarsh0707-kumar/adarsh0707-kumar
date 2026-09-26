[![Adarsh Kumar — Backend and Systems Engineer](https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/header.svg)](https://github.com/adarsh0707-kumar/adarsh0707-kumar/blob/main/profile/header.svg)
[![Building from the socket layer up](https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/specialization.svg)](https://github.com/adarsh0707-kumar/adarsh0707-kumar/blob/main/profile/specialization.svg)
[![Typing SVG](https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/typing.svg)](https://github.com/adarsh0707-kumar/adarsh0707-kumar/blob/main/profile/typing.svg)

<br/>

<p align="center">
  <a href="https://github.com/adarsh0707-kumar">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  &nbsp;&nbsp;
  <a href="https://linkedin.com/in/Adarsh-kumar-657315251">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
  &nbsp;&nbsp;
  <a href="mailto:adarshku.offical@gmail.com">
    <img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
  &nbsp;&nbsp;
  <a href="https://instagram.com/i_.a_k">
    <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" />
  </a>
</p>

<br/>

---

<h2 align="center">👨‍💻 About Me</h2>


<p align="center">
  <img src="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/about.svg" alt="Adarsh Kumar — Backend & Systems Engineer" width="100%" />
</p>

---

<h2 align="center">🚀 Featured Projects</h2>

<table>
<tr>
<td width="50%" valign="top">

### ⚡ [Cloud-Based Trading Engine](https://github.com/adarsh0707-kumar/Trading-Engine)

**Polyglot algorithmic trading simulation**

A production-style trading platform demonstrating how modern exchange infrastructure is structured across performance-critical systems, quantitative analytics, and real-time visualization.

**Architecture:**
- **C++ engine** — Order book, price-time-priority matching, partial fills, market data simulation, TCP/Unix socket server
- **Python analytics** — VWAP, SMA/EMA, PnL, exposure, drawdown, risk metrics via NumPy/Pandas
- **Node.js gateway** — REST API, WebSocket streaming, rate limiting, request validation (TypeScript)
- **React dashboard** — Live market charts, order book, trade feed, portfolio metrics (Vite + Recharts)

**Stack:** C++ · Python · Node.js · TypeScript · React · Docker Compose · GitHub Actions · CMake

**Highlights:**
- Deterministic price-time-priority matching engine with partial fills
- End-to-end event flow: tick → match → trade → analytics → API → dashboard
- Full test pyramid: C++ unit · Pytest · Node test · React component · E2E
- Architecture Decision Records (ADR-001 through ADR-006)

</td>
<td width="50%" valign="top">

### 🏥 [Medical Billing System](https://github.com/adarsh0707-kumar/medical-billing)

**Full-stack pharmacy billing, inventory & GST platform**

A production-style multi-tenant SaaS for retail pharmacies handling money, stock, and tax records — where correctness matters more than delivery speed.

**Architecture:**
- **Frontend** — React 19, TypeScript, Vite, Tailwind v4, shadcn/ui
- **Backend** — Node 22, Express 5, Zod validation, JWT auth
- **Database** — PostgreSQL 15 via Prisma ORM
- **Deployment** — Docker Compose + nginx (same-origin by default)

**Features:**
- Point-of-sale billing with GST compliance
- Batch-level stock tracking with expiry alerts
- Multi-shop tenancy — isolated data per pharmacy via JWT-scoped `shopId`
- Three role levels: `ADMIN` · `PHARMACIST` · `CASHIER`
- Daily sales and GST reports
- HttpOnly refresh cookie with `Origin`-guard CSRF protection

**Stack:** React · TypeScript · Node.js · Express · Prisma · PostgreSQL · Docker · nginx

**Highlights:**
- 10-document `docs/` set: PRD, architecture, data model, API reference, security, gap analysis
- GST acceptance fixtures in the test suite
- Versioned URL scheme with deprecation policy

</td>
</tr>

<tr>
<td width="50%" valign="top">

### 🗄️ [MiniDB — SQL Database Engine](https://github.com/adarsh0707-kumar/Database-engine)

**SQL-like database engine built from scratch in C++**

A lightweight database engine demonstrating core database internals — parsing, execution planning, and persistent storage — written from first principles without any external DB libraries.

**Architecture:**
- **Parser** — Tokenizes SQL input, handles `CREATE`, `INSERT`, `SELECT`, `UPDATE`, `DELETE`, builds structured command objects
- **Executor** — Routes parsed commands to appropriate storage operations
- **Storage Engine** — In-memory execution via `std::map<string, vector<vector<string>>>` with file-based persistence (`data/*.table`)

**Features:**
- CREATE TABLE, INSERT INTO, SELECT with WHERE filtering
- UPDATE and DELETE with WHERE clauses
- Loads data at startup from disk, persists on modification
- Modular separation: parser · executor · storage

**Stack:** C++ · Makefile

**Highlights:**
- Zero external dependencies — pure C++ standard library
- Custom tokenizer + command parser (not a full SQL grammar, but principled)
- Demonstrates low-level systems design often skipped in CRUD applications
- Clear roadmap: dynamic schemas, B-tree indexing, ACID transactions

</td>
<td width="50%" valign="top">

### 🎬 [Movie Recommender AI/ML](https://github.com/adarsh0707-kumar/Movie-Recommender-AI-ML)

**Content-based recommendation system** · **[🔗 Live Demo](https://movie-recommender-ai-ml-tlwmplmuwglcjjlqxqg2kx.streamlit.app/)**

A machine-learning-powered movie recommender that suggests 5 similar films based on plot, genre, keywords, cast, and director — deployed live on Streamlit Cloud.

**Architecture:**
- **Pipeline** — Merge TMDB 5000 movies + credits datasets on title
- **Feature engineering** — Concatenate overview, genres, keywords, top-3 cast, director into a "tags" string
- **Text normalization** — Porter stemming via NLTK (e.g. "loving"/"loved" → "love")
- **Vectorization** — `CountVectorizer` (top 5,000 terms, English stop words removed)
- **Similarity** — Cosine similarity over a ~4,800 × 4,800 matrix
- **Serving** — Streamlit app with `st.cache_resource` for one-time model build

**Features:**
- Select from ~4,800 movies and get 5 recommendations instantly
- Live poster images pulled from TMDB API
- Runs without an API key (falls back to placeholders)
- First-load model build ~20s, subsequent recommendations are near-instant

**Stack:** Python · pandas · scikit-learn · NLTK · Streamlit · TMDB API

**Highlights:**
- Content-based filtering (no collaborative filtering) — no user data required
- Graceful degradation when `TMDB_API_KEY` is missing
- Documented limitations: duplicate-title merge bug, no precision@k metric
- Roadmap: TF-IDF upgrade, Docker, evaluation harness

</td>
</tr>
</table>


---

<h2 align="center">🛠️ Tech Stack</h2>

<table width="100%" style="width:100%">
<tr>
<td width="180" valign="middle"><b>Languages</b></td>
<td align="center">
  <img src="https://skillicons.dev/icons?i=cpp,c,python,ts,js,java" height="44" />
</td>
</tr>
<tr>
<td valign="middle"><b>Backend &amp; Data</b></td>
<td align="center">
  <img src="https://skillicons.dev/icons?i=nodejs,express,postgres,redis,prisma" height="44" />
</td>
</tr>
<tr>
<td valign="middle"><b>Frontend</b></td>
<td align="center">
  <img src="https://skillicons.dev/icons?i=react,nextjs,vite,tailwind" height="44" />
</td>
</tr>
<tr>
<td valign="middle"><b>Infrastructure</b></td>
<td align="center">
  <img src="https://skillicons.dev/icons?i=linux,docker,aws,githubactions,cmake,git" height="44" />
</td>
</tr>
<tr>
<td valign="middle"><b>AI / ML</b></td>
<td align="center">
  <img src="https://skillicons.dev/icons?i=python,sklearn,tensorflow" height="44" />
  <img src="https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white" height="28" />
  <img src="https://img.shields.io/badge/pandas-150458?style=for-the-badge&logo=pandas&logoColor=white" height="28" />
  <img src="https://img.shields.io/badge/NumPy-013243?style=for-the-badge&logo=numpy&logoColor=white" height="28" />
</td>
</tr>
</table>

---

<h2 align="center">📊 GitHub Stats</h2>

<img src="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/stats-dashboard.svg" alt="Adarsh Kumar GitHub stats dashboard" width="100%" />

<img src="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/stats-summary.svg" alt="Adarsh Kumar GitHub stats summary" width="100%" />

---

<h2 align="center">🧠 Spent My Time</h2>

<img src="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/spent-my-time.svg" alt="Adarsh Kumar — Spent My Time" width="100%" />

<br/>

---

<h2 align="center">🌆 3D Contribution Graph</h2>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&duration=5000&pause=2000&color=39D353&center=true&vCenter=true&width=900&lines=Building+from+the+socket+layer+up;C%2B%2B+%E2%80%A2+Python+%E2%80%A2+Node.js+%E2%80%A2+PostgreSQL+%E2%80%A2+AWS;Open+to+Software+Engineering+%26+Backend+roles" alt="Building from the socket layer up" />
</p>

<br/>

<img src="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile-3d-contrib/profile-night-rainbow.svg" alt="Adarsh Kumar 3D contribution graph — night rainbow" width="100%" />

<table>
<tr>
<td width="50%">
<img src="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile-3d-contrib/profile-season-animate.svg" alt="Adarsh Kumar 3D contribution graph — season animated" width="100%" />
</td>
<td width="50%">
<img src="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile-3d-contrib/profile-night-view.svg" alt="Adarsh Kumar 3D contribution graph — night view" width="100%" />
</td>
</tr>
</table>


<h2 align="center">📈 Activity Graph</h2>

<img src="https://fabianocouto-activity-graph.vercel.app/graph/?username=adarsh0707-kumar&theme=merko&hide_border=true&bg_color=0d1117&color=39d353&line=39d353&point=7ee787&area=true&area_color=39d353" alt="Adarsh Kumar activity graph" width="100%" />

<a href="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/gh-pages/github-contribution-grid-snake.svg">
  <img src="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/gh-pages/github-contribution-grid-snake.svg" alt="Animated GitHub contribution snake" width="100%" />
</a>

<h2 align="center">🏆 Trophy Case</h2>

[![Adarsh Kumar GitHub trophies](https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/trophy.svg)](https://github.com/adarsh0707-kumar/adarsh0707-kumar/blob/main/profile/trophy.svg)

---

<h2 align="center">🏆 Certifications</h2>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&duration=5000&pause=2000&color=39D353&center=true&vCenter=true&width=800&lines=6+Certificates+%7C+3+Learning+Tracks;Systems+%E2%80%A2+Backend+%E2%80%A2+Infrastructure+%E2%80%A2+Distributed;Always+learning.+Always+building." alt="Certifications and learning tracks" />
</p>

<br/>

<p align="center">
  <img src="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/certifications-hero.svg" alt="Adarsh Kumar — Certifications & Professional Achievements" width="100%" />
</p>

<br/><br/><br/>

<p align="center">
  <img src="https://img.shields.io/badge/CERTIFICATES-6-39d353?style=for-the-badge&labelColor=0d1117" />
  <img src="https://img.shields.io/badge/LEARNING_TRACKS-3-58a6ff?style=for-the-badge&labelColor=0d1117" />
  <img src="https://img.shields.io/badge/FEATURED_PROJECTS-4-7ee787?style=for-the-badge&labelColor=0d1117" />
  <img src="https://img.shields.io/badge/LEARNING_MODE-ALWAYS_ON-2ea043?style=for-the-badge&labelColor=0d1117" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/SYSTEMS_%26_NETWORKING-8b5cf6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/BACKEND_%26_DATABASES-0ea5e9?style=for-the-badge" />
  <img src="https://img.shields.io/badge/WEB_%26_MEDIA-14b8a6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/INFRA_%26_DEVOPS-22c55e?style=for-the-badge" />
  <img src="https://img.shields.io/badge/PROFESSIONAL-f59e0b?style=for-the-badge" />
</p>

<br/><br/><br/>

<p align="center">
  <b>💻 Software Engineering</b><br/><br/>
  <img src="https://img.shields.io/badge/TRACK-SOFTWARE_ENGINEERING-39d353?style=flat-square&labelColor=0d1117" />
</p>

<table align="center">
<tr>
<td align="center">
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/satyam-internship.jpg">
    <img src="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/satyam-internship.jpg" width="220" alt="Software Development Internship" />
  </a><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/satyam-internship.jpg"><b>Software Development Internship</b></a><br/><br/>
  <img src="https://img.shields.io/badge/Satyam_Software_Solutions-0369a1?style=flat-square" /><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/satyam-internship.jpg">
    <img src="https://img.shields.io/badge/VIEW-CERTIFICATE-39d353?style=for-the-badge" />
  </a>
</td>
<!-- <td align="center" width="33%"></td>
<td align="center" width="33%"></td> -->
</tr>
</table>

<br/><br/><br/>

<p align="center">
  <b>📊 Data & Analytics</b><br/><br/>
  <img src="https://img.shields.io/badge/TRACK-DATA_%26_ANALYTICS-a371f7?style=flat-square&labelColor=0d1117" />
</p>

<table align="center">
<tr>
<td align="center" width="33%">
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/rcpl-data-science-python.png">
    <img src="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/rcpl-data-science-python.png" width="220" alt="Data Science with Python" />
  </a><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/rcpl-data-science-python.png"><b>Data Science with Python</b></a><br/><br/>
  <img src="https://img.shields.io/badge/RCPL_×_ITS_College-a371f7?style=flat-square" /><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/rcpl-data-science-python.png">
    <img src="https://img.shields.io/badge/VIEW-CERTIFICATE-39d353?style=for-the-badge" />
  </a>
</td>
<td align="center" width="33%">
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-power-bi.jpg">
    <img src="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-power-bi.jpg" width="220" alt="Power BI Micro Course" />
  </a><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-power-bi.jpg"><b>Power BI Micro Course</b></a><br/><br/>
  <img src="https://img.shields.io/badge/SkillCourse-f0883e?style=flat-square" /><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-power-bi.jpg">
    <img src="https://img.shields.io/badge/VIEW-CERTIFICATE-39d353?style=for-the-badge" />
  </a>
</td>
<td align="center" width="33%">
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-sql.png">
    <img src="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-sql.png" width="220" alt="SQL Micro Course" />
  </a><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-sql.png"><b>SQL Micro Course</b></a><br/><br/>
  <img src="https://img.shields.io/badge/SkillCourse-f0883e?style=flat-square" /><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-sql.png">
    <img src="https://img.shields.io/badge/VIEW-CERTIFICATE-39d353?style=for-the-badge" />
  </a>
</td>
</tr>
<tr>
<td align="center">
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-excel.jpg">
    <img src="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-excel.jpg" width="220" alt="Microsoft Excel" />
  </a><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-excel.jpg"><b>Microsoft Excel — Beginners to Advance</b></a><br/><br/>
  <img src="https://img.shields.io/badge/SkillCourse-f0883e?style=flat-square" /><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-excel.jpg">
    <img src="https://img.shields.io/badge/VIEW-CERTIFICATE-39d353?style=for-the-badge" />
  </a>
</td>

</tr>
</table>

<br/><br/><br/>

<p align="center">
  <b>🐍 Programming Foundations</b><br/><br/>
  <img src="https://img.shields.io/badge/TRACK-PROGRAMMING_FOUNDATIONS-58a6ff?style=flat-square&labelColor=0d1117" />
</p>

<table align="center">
<tr>
<td align="center" >
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-python.jpg">
    <img src="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-python.jpg" width="220" alt="Python Micro Course" />
  </a><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-python.jpg"><b>Python Micro Course</b></a><br/><br/>
  <img src="https://img.shields.io/badge/SkillCourse-f0883e?style=flat-square" /><br/><br/>
  <a href="https://raw.githubusercontent.com/adarsh0707-kumar/portfolio/main/public/certificates/skillcourse-python.jpg">
    <img src="https://img.shields.io/badge/VIEW-CERTIFICATE-39d353?style=for-the-badge" />
  </a>
</td>

</tr>
</table>

<p align="center">
  <a href="https://linkedin.com/in/Adarsh-kumar-657315251/details/certifications/">
    <img src="https://img.shields.io/badge/VIEW_ALL_CREDENTIALS-LINKEDIN-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/-VERIFIED_LEARNING_PORTFOLIO-0d1117?style=for-the-badge" height="36" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/📜_CERTIFICATES-6-39d353?style=for-the-badge&labelColor=555555" />
  <img src="https://img.shields.io/badge/⚙️_SYSTEMS_%26_NETWORKING-FOCUSED-58a6ff?style=for-the-badge&labelColor=555555" />
  <img src="https://img.shields.io/badge/💼_BACKEND_%26_DATABASES-ACTIVE-f0883e?style=for-the-badge&labelColor=555555" />
</p>

<br/>

<p align="center">
  <a href="https://linkedin.com/in/Adarsh-kumar-657315251/details/certifications/">
    <img src="https://img.shields.io/badge/📁_BROWSE_ALL_CERTIFICATES-000000?style=for-the-badge&logoColor=white" height="40" />
  </a>
</p>


<p align="center">
  <img src="https://img.shields.io/badge/✨_Continuous_Learning_•_Practical_Skills_•_Verified_Knowledge-0d1117?style=for-the-badge" height="34" />
</p>

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=adarsh0707-kumar&label=PROFILE+VIEWS&color=39d353&style=for-the-badge" />
</p>

<br/>

<p align="center">
  <a href="https://github.com/adarsh0707-kumar">
    <img src="https://img.shields.io/badge/🐙_GITHUB-PROFILE-181717?style=for-the-badge" />
  </a>
  <a href="https://github.com/adarsh0707-kumar?tab=repositories">
    <img src="https://img.shields.io/badge/📂_REPOSITORIES-EXPLORE-0A66C2?style=for-the-badge" />
  </a>
</p>

---

<h2 align="center">🌱 Currently Exploring</h2>

<table align="center">
<tr>
<td valign="top" width="50%">

- 🧠 **Large Language Models (LLMs)**
  *Fine-tuning, prompt engineering, local inference*

- 🔍 **Retrieval-Augmented Generation (RAG)**
  *Vector DBs, embeddings, hybrid search*

- ⚡ **Distributed Systems**
  *Consensus, replication, sharding*

- ☁️ **Cloud-Native Backend**
  *Containers, service mesh, K8s operators*

</td>
<td valign="top" width="50%">

- 🤖 **AI Infrastructure & MLOps**
  *Model serving, GPU orchestration, monitoring*

- 📦 **Microservices Architecture**
  *gRPC, event-driven design, API gateways*

- 🚀 **High-Performance Backend**
  *Lock-free structures, zero-copy I/O, eBPF*

- 🔐 **Systems Security**
  *TLS, auth protocols, threat modeling*

</td>
</tr>
</table>

---

<h2 align="center">⭐ Submit Your Rating & Feedback</h2>

<p align="center">
  Enjoyed my work? Pick a star rating below.<br/>
  The form opens with your rating pre-selected — your message goes straight to my inbox.
</p>

<p align="center">
  <table align="center">
    <tr>
      <th align="center">Rating</th>
      <th align="center">Click to rate</th>
    </tr>
    <tr>
      <td align="center">⭐⭐⭐⭐⭐</td>
      <td align="center">
        <a href="mailto:adarshku.offical@gmail.com?subject=Feedback%3A%205%20Stars%20-%20Excellent&body=Hi%20Adarsh%2C%0A%0AI%20wanted%20to%20share%20some%20feedback%20on%20your%20work%3A%0A">
          <img src="https://img.shields.io/badge/RATE-5_STARS_--_EXCELLENT-14b8a6?style=for-the-badge&labelColor=555555" />
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">⭐⭐⭐⭐</td>
      <td align="center">
        <a href="mailto:adarshku.offical@gmail.com?subject=Feedback%3A%204%20Stars%20-%20Very%20Good&body=Hi%20Adarsh%2C%0A%0AI%20wanted%20to%20share%20some%20feedback%20on%20your%20work%3A%0A">
          <img src="https://img.shields.io/badge/RATE-4_STARS_--_VERY_GOOD-14b8a6?style=for-the-badge&labelColor=555555" />
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">⭐⭐⭐</td>
      <td align="center">
        <a href="mailto:adarshku.offical@gmail.com?subject=Feedback%3A%203%20Stars%20-%20Good&body=Hi%20Adarsh%2C%0A%0AI%20wanted%20to%20share%20some%20feedback%20on%20your%20work%3A%0A">
          <img src="https://img.shields.io/badge/RATE-3_STARS_--_GOOD-f59e0b?style=for-the-badge&labelColor=555555" />
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">⭐⭐</td>
      <td align="center">
        <a href="mailto:adarshku.offical@gmail.com?subject=Feedback%3A%202%20Stars%20-%20Fair&body=Hi%20Adarsh%2C%0A%0AI%20wanted%20to%20share%20some%20feedback%20on%20your%20work%3A%0A">
          <img src="https://img.shields.io/badge/RATE-2_STARS_--_FAIR-f59e0b?style=for-the-badge&labelColor=555555" />
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">⭐</td>
      <td align="center">
        <a href="mailto:adarshku.offical@gmail.com?subject=Feedback%3A%201%20Star%20-%20Poor&body=Hi%20Adarsh%2C%0A%0AI%20wanted%20to%20share%20some%20feedback%20on%20your%20work%3A%0A">
          <img src="https://img.shields.io/badge/RATE-1_STAR_--_POOR-f87171?style=for-the-badge&labelColor=555555" />
        </a>
      </td>
    </tr>
  </table>
</p>

<br/>

<p align="center">
  <a href="mailto:adarshku.offical@gmail.com">
    <img src="https://img.shields.io/badge/EMAIL-adarshku.offical%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
  &nbsp;
  <a href="mailto:adarshku.offical@gmail.com?subject=Feedback%20on%20your%20GitHub%20profile&body=Hi%20Adarsh%2C%0A%0AHere%20are%20my%20suggestions%3A%0A">
    <img src="https://img.shields.io/badge/WRITE_FEEDBACK-SHARE_YOUR_SUGGESTIONS-14b8a6?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
</p>

---

<h2 align="center">💬 Session Feedback</h2>

<img src="https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/session-feedback.svg" alt="Adarsh Kumar — Session Feedback" width="100%" />

---

<h2 align="center">⭐ Support</h2>

<p align="center">
  If you find this repository useful for learning <b>Backend</b>, <b>Systems</b>, and <b>Distributed Systems</b>,<br/>
  consider giving it a ⭐.
</p>

<p align="center">
  Your feedback, suggestions, and contributions are welcome.
</p>

<br/>

<p align="center">
  ⚙️ <b>Build Systems</b> &nbsp;•&nbsp; 🗄️ <b>Design Databases</b> &nbsp;•&nbsp; 🚀 <b>Ship Backends</b> &nbsp;•&nbsp; 🌐 <b>Learn Networking</b>
</p>

<br/>

<p align="center">
  Made with ❤️ for learning, experimentation, and continuous improvement.
</p>

---

<h2 align="center">🎯 What I'm Looking For</h2>

<p align="center">
  I'm actively looking for <b>Software Engineering</b>, <b>Backend Engineering</b>, and <b>Systems / Infrastructure</b> roles<br/>
  where I can contribute to real-world systems, learn from experienced engineers,<br/>
  and build scalable products from the socket layer up.
</p>

<p align="center">
  If you'd like to collaborate, discuss an opportunity, or just connect — feel free to reach out.
</p>


---

<p align="center">
  <b>Thanks for visiting my profile!</b>
</p>

<p align="center">
  If you like my work, consider giving a ⭐ to the repositories you find useful.
</p>

<br/>

<p align="center">
  <a href="https://github.com/adarsh0707-kumar">
    <img src="https://img.shields.io/badge/⭐_Star_My_Repos-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  &nbsp;
  <a href="https://linkedin.com/in/Adarsh-kumar-657315251">
    <img src="https://img.shields.io/badge/Connect_on_LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
  &nbsp;
  <a href="mailto:adarshku.offical@gmail.com">
    <img src="https://img.shields.io/badge/Say_Hello-D14836?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
</p>

<br/><br/><br/>

[![Adarsh Kumar footer](https://raw.githubusercontent.com/adarsh0707-kumar/adarsh0707-kumar/main/profile/footer.svg)](https://github.com/adarsh0707-kumar/adarsh0707-kumar/blob/main/profile/footer.svg)
