CREATE TABLE Categoria (
    idCategoria SERIAL        NOT NULL,
    nombre      VARCHAR(50)   NOT NULL,
    CONSTRAINT Categoria_PK PRIMARY KEY (idCategoria)
);

CREATE TABLE Ingrediente (
    idIngrediente SERIAL       NOT NULL,
    nombre        VARCHAR(100) NOT NULL,
    CONSTRAINT Ingrediente_PK PRIMARY KEY (idIngrediente)
);

CREATE TABLE Usuario (
    idUsuario      SERIAL       NOT NULL,
    nickname       VARCHAR(30)  NOT NULL,
    email          VARCHAR(50)  NOT NULL,
    contrasena     VARCHAR(30)  NOT NULL,  
    fecha_registro DATE,
    fotoPerfil     BYTEA,                  
    CONSTRAINT Usuario_PK PRIMARY KEY (idUsuario)
);

CREATE TABLE Receta (
    idReceta          SERIAL        NOT NULL,
    nombre            VARCHAR(50)   NOT NULL,
    descripcion       VARCHAR(200),
    tiempoPreparacion VARCHAR(30)   NOT NULL,
    calorias          VARCHAR(10)   NOT NULL,
    imagenReceta      BYTEA,                 
    fechaCreacion     DATE          NOT NULL,
    CONSTRAINT Receta_PK PRIMARY KEY (idReceta)
);

CREATE TABLE Paso (
    idPaso          SERIAL        NOT NULL,
    descripcion     VARCHAR(500)  NOT NULL,
    Receta_idReceta INTEGER       NOT NULL,
    numeroPaso      INTEGER       NOT NULL,
    CONSTRAINT Paso_PK PRIMARY KEY (idPaso),
    CONSTRAINT Paso_Receta_FK FOREIGN KEY (Receta_idReceta)
        REFERENCES Receta (idReceta)
);

CREATE TABLE RecetaIngrediente (
    Receta_idReceta           INTEGER     NOT NULL,
    Ingrediente_idIngrediente INTEGER     NOT NULL,
    cantidadIngrediente       VARCHAR(20),
    CONSTRAINT RecetaIngrediente_PK PRIMARY KEY (Receta_idReceta, Ingrediente_idIngrediente),
    CONSTRAINT RecetaCategoria_Receta_FK FOREIGN KEY (Receta_idReceta)
        REFERENCES Receta (idReceta),
    CONSTRAINT RecetaCategoria_Ingrediente_FK FOREIGN KEY (Ingrediente_idIngrediente)
        REFERENCES Ingrediente (idIngrediente)
);

CREATE TABLE recetaGuardada (
    fecha_guardado    DATE,
    Usuario_idUsuario INTEGER NOT NULL,
    Receta_idReceta   INTEGER NOT NULL,
    CONSTRAINT recetaGuardada_PK PRIMARY KEY (Usuario_idUsuario),
    CONSTRAINT recetaGuardada_Usuario_FK FOREIGN KEY (Usuario_idUsuario)
        REFERENCES Usuario (idUsuario),
    CONSTRAINT recetaGuardada_Receta_FK FOREIGN KEY (Receta_idReceta)
        REFERENCES Receta (idReceta)
);

CREATE TABLE RecetaCategoria (
    Receta_idReceta       INTEGER NOT NULL,
    Categoria_idCategoria INTEGER NOT NULL,
    CONSTRAINT RecetaCategoria_PK PRIMARY KEY (Receta_idReceta, Categoria_idCategoria),
    CONSTRAINT RecetaIngrediente_Receta_FK FOREIGN KEY (Receta_idReceta)
        REFERENCES Receta (idReceta),
    CONSTRAINT RecetaIngrediente_Categoria_FK FOREIGN KEY (Categoria_idCategoria)
        REFERENCES Categoria (idCategoria)
);


