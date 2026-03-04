-- Generado por Oracle SQL Developer Data Modeler 24.3.1.351.0831
--   en:        2026-02-25 20:20:01 COT
--   sitio:      Oracle Database 11g
--   tipo:      Oracle Database 11g

CREATE TABLE Categoria 
    ( 
     idCategoria NUMBER  NOT NULL , 
     nombre      VARCHAR2 (50)  NOT NULL 
    ) 
;

ALTER TABLE Categoria 
    ADD CONSTRAINT Categoria_PK PRIMARY KEY ( idCategoria ) ;

CREATE TABLE Ingrediente 
    ( 
     idIngrediente NUMBER  NOT NULL , 
     nombre        VARCHAR2 (100) 

                     NOT NULL 
    ) 
;

ALTER TABLE Ingrediente 
    ADD CONSTRAINT Ingrediente_PK PRIMARY KEY ( idIngrediente ) ;

CREATE TABLE Paso 
    ( 
     idPaso          NUMBER  NOT NULL , 
     descripcion     VARCHAR2 (500)  NOT NULL , 
     Receta_idReceta NUMBER  NOT NULL , 
     numeroPaso      NUMBER  NOT NULL 
    ) 
;

ALTER TABLE Paso 
    ADD CONSTRAINT Paso_PK PRIMARY KEY ( idPaso ) ;

CREATE TABLE Receta 
    ( 
     idReceta          NUMBER  NOT NULL , 
     nombre            VARCHAR2 (50)  NOT NULL , 
     descripcion       VARCHAR2 (200) , 
     tiempoPreparacion VARCHAR2 (30)  NOT NULL , 
     calorias          VARCHAR2 (10)  NOT NULL , 
     imagenReceta      BLOB , 
     fechaCreacion     DATE  NOT NULL , 
     Usuario_idUsuario NUMBER  NOT NULL 
    ) 
;

ALTER TABLE Receta 
    ADD CONSTRAINT Receta_PK PRIMARY KEY ( idReceta ) ;

CREATE TABLE RecetaCategoria 
    ( 
     Receta_idReceta           NUMBER  NOT NULL , 
     Ingrediente_idIngrediente NUMBER  NOT NULL , 
     cantidadIngrediente       VARCHAR2 (20) 
    ) 
;

CREATE TABLE recetaGuardada 
    ( 
     fecha_guardado    DATE , 
     Usuario_idUsuario NUMBER  NOT NULL , 
     Receta_idReceta   NUMBER  NOT NULL 
    ) 
;

ALTER TABLE recetaGuardada 
    ADD CONSTRAINT recetaGuardada_PK PRIMARY KEY ( Usuario_idUsuario ) ;

CREATE TABLE RecetaIngrediente 
    ( 
     Receta_idReceta       NUMBER  NOT NULL , 
     Categoria_idCategoria NUMBER  NOT NULL 
    ) 
;

CREATE TABLE Usuario 
    ( 
     idUsuario      NUMBER  NOT NULL , 
     nickname       VARCHAR2 (30)  NOT NULL , 
     email          VARCHAR2 (50)  NOT NULL , 
     contraseña     VARCHAR2 (30)  NOT NULL , 
     fecha_registro DATE , 
     fotoPerfil     BLOB 
    ) 
;

ALTER TABLE Usuario 
    ADD CONSTRAINT Usuario_PK PRIMARY KEY ( idUsuario ) ;

ALTER TABLE Paso 
    ADD CONSTRAINT Paso_Receta_FK FOREIGN KEY 
    ( 
     Receta_idReceta
    ) 
    REFERENCES Receta 
    ( 
     idReceta
    ) 
;

ALTER TABLE Receta 
    ADD CONSTRAINT Receta_Usuario_FK FOREIGN KEY 
    ( 
     Usuario_idUsuario
    ) 
    REFERENCES Usuario 
    ( 
     idUsuario
    ) 
;

ALTER TABLE RecetaCategoria 
    ADD CONSTRAINT RecetaCategoria_Ingrediente_FK FOREIGN KEY 
    ( 
     Ingrediente_idIngrediente
    ) 
    REFERENCES Ingrediente 
    ( 
     idIngrediente
    ) 
;

ALTER TABLE RecetaCategoria 
    ADD CONSTRAINT RecetaCategoria_Receta_FK FOREIGN KEY 
    ( 
     Receta_idReceta
    ) 
    REFERENCES Receta 
    ( 
     idReceta
    ) 
;

ALTER TABLE recetaGuardada 
    ADD CONSTRAINT recetaGuardada_Receta_FK FOREIGN KEY 
    ( 
     Receta_idReceta
    ) 
    REFERENCES Receta 
    ( 
     idReceta
    ) 
;

ALTER TABLE recetaGuardada 
    ADD CONSTRAINT recetaGuardada_Usuario_FK FOREIGN KEY 
    ( 
     Usuario_idUsuario
    ) 
    REFERENCES Usuario 
    ( 
     idUsuario
    ) 
;

ALTER TABLE RecetaIngrediente 
    ADD CONSTRAINT RecetaIngrediente_Categoria_FK FOREIGN KEY 
    ( 
     Categoria_idCategoria
    ) 
    REFERENCES Categoria 
    ( 
     idCategoria
    ) 
;

ALTER TABLE RecetaIngrediente 
    ADD CONSTRAINT RecetaIngrediente_Receta_FK FOREIGN KEY 
    ( 
     Receta_idReceta
    ) 
    REFERENCES Receta 
    ( 
     idReceta
    ) 
;

