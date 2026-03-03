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
│   ├── blank.txt
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
````

## Folder Descriptions

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

### `src/`

Main source code folder.

- `main/`: Main application source code.

  - `resources/`: Resource files such as configuration or other required files.

    - `prisma/`: Prisma-specific configuration and modules.

      - `prisma.module.ts`: Prisma module definition.
      - `prisma.service.ts`: Prisma service for database access.
  - `ts/`: Core TypeScript code.

    - `common/`: Shared utilities, helpers, DTOs, interceptors, etc.
    - `modules/`: Application modules, each representing a feature (e.g., recipes, users, auth).
    - `app.module.ts`: Root module importing other modules.
    - `main.ts`: Application entry point.
- `test/`: Test code.

  - `resources/`: Placeholder for test resources.

### `Scripts/`

Useful scripts for common tasks such as setup, deployment, and testing.

- `setup.hs`: Script to configure the development environment.
- `deploy.sh`: Deployment script.
- `test.sh`: Script to run tests.

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

