# recetaYa_boilerplate
## Project Structure

```bash
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
├── assets
│   └── Database
│       └── BaseDatosRecetaYa.sql
├── conf
│   ├── config.yaml
│   └── settings.json
├── docs
│   ├── api
│   ├── documentation
│   │   ├── DiagramaRecetaYa.dmd
│   │   ├── ModeloBDRecetaYa.pdf
│   │   └── recetas_Basico_extendido.xlsx
│   ├── user_guide
│   └── Documentación login recetaya.pdf
├── frontend
│   ├── login-register
│   │   ├── loginRecetaYa.css
│   │   ├── loginRecetaYa.html
│   │   ├── loginRecetaYa.js
│   │   ├── registerRecetaYa.css
│   │   ├── registerRecetaYa.html
│   │   └── registerRecetaYa.js
│   └── search
│       ├── index.css
│       ├── index.html
│       └── index.js
├── prisma
│   ├── migrations
│   │   ├── 20260303041620_init
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── prisma.service.ts
│   └── schema.prisma
├── Scripts
│   ├── deploy.sh
│   ├── insert-recipes.ts
│   ├── recipes.csv
│   ├── setup.hs
│   └── test.sh
├── src
│   ├── ingredientes
│   │   ├── dto
│   │   │   └── buscar-ingrediente.dto.ts
│   │   ├── ingredientes.controller.ts
│   │   ├── ingredientes.module.ts
│   │   └── ingredientes.service.ts
│   ├── recetas
│   │   ├── dto
│   │   │   └── buscar-recetas.dto.ts
│   │   ├── recetas.controller.ts
│   │   ├── recetas.module.ts
│   │   └── recetas.service.ts
│   ├── test
│   │   ├── java
│   │   └── resources
│   ├── usuarios
│   │   ├── dto
│   │   │   ├── login.dto.ts
│   │   │   └── register.dto.ts
│   │   ├── usuarios.controller.ts
│   │   ├── usuarios.module.ts
│   │   └── usuarios.service.ts
│   ├── app.module.ts
│   └── main.ts
├── temp
│   ├── temp_data
│   │   ├── temp1.tmp
│   │   └── temp2.tmp
│   └── temp_file.txt
├── BOILERPLATE.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── docker-compose.yml
├── Dockerfile
├── LICENSE
├── Makefile
├── nest-cli.json
├── package.json
├── package-lock.json
├── prisma.config.ts
├── README.md
└── tsconfig.json
````

## Folder Descriptions

### `assets/Database`
SQL code and database structure that was later migrated to prisma.
### `.github/`

Contains GitHub-specific configurations, including templates for issues and pull requests, and GitHub Actions workflows for Continuous Integration (CI) and Continuous Deployment (CD).

- `ISSUE_TEMPLATE/`: Templates for reporting bugs and requesting new features.
- `workflows/`: YAML files defining CI/CD workflows.
- `PULL_REQUEST_TEMPLATE.md`: Template for pull request description.

### `docs/`

Project documentation.

- `api/`: API documentation.
- `architecture/`: Architecture diagrams and documentation.
- `user_guide/`: User guides for end users.
- `documentation/` All diagrams and files related to our project (UML, E-R, excel spreadsheet, etc.)

### `frontend/`

All frontend html, css and javascript Files

### `prisma/`: 
Prisma-specific configuration and modules.

      - `schema.prisma`: Database schema according to prisma to then be migrated to postgresql
      - `prisma.service.ts`: Prisma service for database access.

### `src/`

Main source code folder.

    - `ingredientes/`: Ingredients module, service, dto and controller.
    - `recetas/`: Recipes module, service, dto and controller
    - `usuarios/`: Usuarios module, service, dto and controller, logic for login authentication.
    - `app.module.ts`: Root module importing other modules.
    - `main.ts`: Application entry point.
    - `test/`: Test code.

### `Scripts/`

Useful scripts for common tasks such as setup, deployment, and testing.

- `setup.hs`: Script to configure the development environment.
- `deploy.sh`: Deployment script.
- `test.sh`: Script to run tests.
- `recipes.csv` Initial spreadsheets filled with data about recipes
- `insert-recipes.ts` Script that would take the recipes in the .csv and insert them in the database through prisma.

### `conf/`

Configuration files.

- `config.yaml`: YAML configuration file.
- `settings.json`: JSON configuration file.

### `temp/`

Temporary files folder.

- `temp_file.txt`: Example temporary file.
- `temp_data/`: Subfolder for temporary data.

  - `temp1.tmp`: Example temporary file.
  - `temp2.tmp`: Another temporary file.

### Root Project Files

- `BOILERPLATE.md`: This file, containing information about the project’s structure.
- `.gitignore`: Specifies which files and directories Git should ignore.
- `README.md`: General project description, installation instructions, usage, contribution guidelines, etc.
- `LICENSE`: Project license information.
- `CHANGELOG.md`: Project change log.
- `CONTRIBUTING.md`: Contribution guide.
- `Dockerfile`: File to build the Docker image for the project.
- `docker-compose.yml`: Docker Compose configuration.
- `Makefile`: File to automate tasks with `make` commands.
- `nest-cli.json`: NestJS CLI configuration (output folders, compiler options).
- `package.json`: Node project metadata, dependencies, and scripts.
- `package-lock.json`: Locks exact dependency versions.
- `tsconfig.json`: TypeScript compiler configuration.
- `prisma.config.ts`: Configuration file for prisma 7.

