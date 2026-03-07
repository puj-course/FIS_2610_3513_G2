# Presenting... RecetaYa!
<p align="center">
<img width="256" height="256" alt="image" src="https://github.com/user-attachments/assets/644004bf-2b7a-4ace-8ceb-f54d65f815a1" />
</p>

_*Have you ever wanted to cook something nice on a student budget?*_  

_*Ever looked up a recipe and realized you’re missing ingredients?*_

**RecetaYa** is a project designed to help people decide what to cook based on the ingredients they already have at home.  
It focuses on a very common situation: having food available but not knowing what recipes can be made with it. :>

---

<p align="center">
  Pick up about have and let us think about a meal. Filter by time, difficulty and diet!
</p>

---

# Index

- [Description](#Description)
- [Team](#-team) 
- [Technologies used](#technologies-used)
- [Structure](#structure)
- [Installation](#instalation)
- [Requeriments](#requirements)
- [Clone this repo](#clone-this-repo)
- [Docker Execution](#docker-execution) 
- [Testing](#testing)
- [Academic Context](#academic-context)
- [Contact](#contact)
- [License](#license)

# Description

Many people have ingredients in their fridge or pantry but don’t know what recipes they can prepare with them. 
This often leads to food waste, time wasted searching for recipes, and frustration when cooking.

RecetaYa aims to simplify this process by suggesting meals based on what the user already has. Recipes can also be filtered by different categories such as types of food, origin of the food, healthiness or time necessary to make

Check out the [Wiki](https://github.com/puj-course/FIS_2610_3513_G2/wiki#presenting-recetaya) for more info about our project :>.

---

# 🤝 Team

**The team behind RecetaYa:**


| Name | Role | Profile |
|------|------|---------|
| Salomé Ávila | Back-end Developer, DevOps Engineer, Configuration Manager | [Salome's Profile](https://github.com/blurryavi) |
| Ale Corredor | Back-end Developer, QA Lead | [Alejandro's Profile](https://github.com/Alendy-24) |
| Juan Sánchez | Front-end Developer, Sprint Planner | [Juan's Profile](https://github.com/jsanchez312) |
| German Rodríguez | Graphic Designer, Product Owner | [German's Profile](https://github.com/germandrzmr) |

---

# Technologies used

<div style="display: flex; width: 100%; overflow-x: auto; gap: 5px; padding: 5px; box-sizing: border-box;" align="center">
 
<img width="11%"  alt="Image" src="https://github.com/user-attachments/assets/548de62c-089a-4eb0-82d8-17fb3d0438bd" />
  <img width="10%" src="https://github.com/user-attachments/assets/28148933-9345-44e9-89a4-119d6d3ba6db" />
  <img width="10%" src="https://github.com/user-attachments/assets/f2407690-ba56-4ce8-b0ea-f38bf1f17a60" />

<img width="9%" alt="Image" src="https://github.com/user-attachments/assets/ece703c5-2b5d-4387-b981-8596eaca3afb" />

  <img width="10%" src="https://github.com/user-attachments/assets/6adbf6f0-a01f-4a05-bf3e-6d6c95ae0a02" />
  
<img width="10%" alt="Image" src="https://github.com/user-attachments/assets/49d39fe9-d0af-4853-8917-da7419aca69e" />
 
 <img width="10%" src="https://github.com/user-attachments/assets/cd5adf16-a7b1-4894-9208-76c215208ccb" />
</div>

- **Frontend:** TBD
- **Backend:** Node.js + Nest.js
- **Database:** PostgreSQL + Prisma ORM
- **DevOps:** Github Actions, Docker, SonarQube
- **Version control:** Git

---

# Structure

```
recetasYaApp/
├── .git/
├── .github
│   ├── ISSUE_TEMPLATE
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows
│       ├── cd.yml
│       └── ci.yml
├── conf
│   ├── config.yaml
│   └── settings.json
├── docs
│   ├── api
│   │   └── .gitkeep
│   ├── architecture
│   │   └── .gitkeep
│   └── user_guide
│       └── .gitkeep
├── prisma
│   └── schema.prisma
├── Scripts
│   ├── deploy.sh
│   ├── setup.hs
│   └── test.sh
├── src
│   ├── main
│   │   ├── resources
│   │   │   ├── .gitkeep
│   │   │   └── prisma
│   │   │       ├── prisma.module.ts
│   │   │       └── prisma.service.ts
│   │   └── ts
│   │       ├── app.module.ts
│   │       ├── common
│   │       ├── main.ts
│   │       └── modules
│   └── test
│       ├── java
│       │   └── .gitkeep
│       └── resources
│           └── .gitkeep
├── temp
│   ├── temp_data
│   │   ├── temp1.tmp
│   │   └── temp2.tmp
│   └── temp_file.txt
├── .dockerignore
├── .gitignore
├── .nvmrc
├── BOILERPLATE.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── docker-compose.yml
├── Dockerfile
├── LICENSE
├── Makefile
├── nest-cli.json
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

# Instalation
## Requirements

- Docker & Docker Compose
- Git
- ...

### Clone this repo

Go into your Linux (important, jk) terminal and try this commands

```
git clone https://github.com/puj-course/FIS_2610_3513_G2.git
cd FIS_2610_3513_G2
```

### Docker Execution
### Testing
# Academic context

- **Course:** Software Engineer Fundamentals
- **Professor:**  Luis Gabriel Moreno Sandoval, PhD
- **Contacto:** morenoluis@javeriana.edu.co

# Contact 

Leave us a message

**Salomé Avila**
Computer science student at Pontificia Universidad Javeriana.
I'll be happy to get in touch.
📧 savilat@javeriana.edu.co

**Alejandro Corredor Morales**
Computer science student at Pontificia Universidad Javeriana.
Dm me anytime you need it!
📧 daniel-corredor@javeriana.edu.co

**Juan Pablo Sánchez Panqueva**
Computer science student at Pontificia Universidad Javeriana.
¡Here to solve any doubts you got!
📧 sanchez.jp@javeriana.edu.co

# License

This project has been developed for academic purposes. 
