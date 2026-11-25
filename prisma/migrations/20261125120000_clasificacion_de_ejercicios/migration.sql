-- DL-197 (WP-EDITOR-ENTRENAMIENTO-TANDA-1, ET1-12; docs/paquetes/WP-EDITOR-ENTRENAMIENTO-TANDA-1.md): la clasificación
-- de los ejercicios, para los filtros de «Agregar ejercicios» (grupo muscular, equipamiento, patrón y articulaciones).
-- GENERADA por scripts/catalogo-base/generar-clasificacion.mjs desde prisma/datos/catalogo-base/clasificacion-de-ejercicios.csv:
-- no se edita. Migración aditiva: cuatro tipos nuevos y cuatro columnas opcionales; nada de lo anterior se toca.
-- - La siembra va a la versión vigente de cada ejercicio de wger por su ítem externo: la del catálogo base o la de un
--   profesional que lo importó antes. Lo que no está (un ambiente sin el catálogo base) no se toca.
-- - Es la PROPUESTA de BE, a validar por Dirección (ET1-D12): corregirla después es una migración nueva.

-- CreateEnum
CREATE TYPE "GrupoMuscularDeEjercicio" AS ENUM ('CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'ABS', 'CALVES', 'CARDIO');

-- CreateEnum
CREATE TYPE "EquipamientoDeEjercicio" AS ENUM ('BARBELL', 'EZ_BAR', 'DUMBBELL', 'KETTLEBELL', 'CABLE', 'MACHINE', 'BENCH', 'INCLINE_BENCH', 'PULL_UP_BAR', 'BAND', 'MAT', 'SWISS_BALL', 'BODYWEIGHT', 'OTHER');

-- CreateEnum
CREATE TYPE "PatronDeMovimiento" AS ENUM ('PUSH', 'PULL', 'SQUAT', 'HINGE', 'LUNGE', 'CORE', 'CARDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "ArticulacionesDeEjercicio" AS ENUM ('SINGLE', 'MULTI');

-- AlterTable
ALTER TABLE "version_de_ejercicio" ADD COLUMN     "articulaciones" "ArticulacionesDeEjercicio",
ADD COLUMN     "equipamiento" "EquipamientoDeEjercicio"[] DEFAULT ARRAY[]::"EquipamientoDeEjercicio"[],
ADD COLUMN     "grupo_muscular" "GrupoMuscularDeEjercicio",
ADD COLUMN     "patron" "PatronDeMovimiento";

-- La siembra: 186 ejercicios del catálogo base.
UPDATE "version_de_ejercicio" v
   SET "grupo_muscular" = n."grupo"::"GrupoMuscularDeEjercicio",
       "equipamiento" = n."equipamiento",
       "patron" = n."patron"::"PatronDeMovimiento",
       "articulaciones" = n."articulaciones"::"ArticulacionesDeEjercicio"
  FROM (VALUES
    ('12', 'LEGS', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Aducción de cadera en máquina
    ('20', 'SHOULDERS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press Arnold
    ('46', 'LEGS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'LUNGE', 'MULTI'), -- Zancadas con barra
    ('51', 'ARMS', ARRAY['BARBELL', 'BENCH']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Curl de muñeca con barra
    ('73', 'CHEST', ARRAY['BARBELL', 'BENCH']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de banca plano con barra
    ('75', 'CHEST', ARRAY['BENCH', 'DUMBBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de banca con mancuernas
    ('76', 'ARMS', ARRAY['BARBELL', 'BENCH']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de banca con agarre cerrado
    ('81', 'BACK', ARRAY['BENCH', 'DUMBBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo con mancuerna a un brazo
    ('82', 'SHOULDERS', ARRAY['BENCH', 'DUMBBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Elevaciones posteriores con mancuernas
    ('83', 'BACK', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo inclinado con barra, agarre prono
    ('84', 'BACK', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo inclinado con barra, agarre supino
    ('91', 'ARMS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Curl de bíceps con barra
    ('92', 'ARMS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Curl de bíceps con mancuernas
    ('95', 'ARMS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Curl de bíceps en polea
    ('129', 'CHEST', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de pecho en máquina
    ('132', 'CHEST', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Burpees
    ('135', 'CHEST', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Aperturas en máquina
    ('142', 'SHOULDERS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Rotación externa de hombro en polea
    ('145', 'ABS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'CORE', 'MULTI'), -- Leñador en polea
    ('146', 'CALVES', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Gemelos en prensa
    ('152', 'BACK', ARRAY['PULL_UP_BAR']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Dominadas con agarre supino
    ('158', 'BACK', ARRAY['CABLE', 'MACHINE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Jalón al pecho con agarre cerrado
    ('161', 'CHEST', ARRAY['DUMBBELL', 'BENCH']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Pullover con mancuerna
    ('167', 'ABS', ARRAY['MAT']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Abdominales crunch
    ('171', 'ABS', ARRAY['INCLINE_BENCH']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Abdominales en banco inclinado
    ('173', 'ABS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Crunch en polea
    ('177', 'CARDIO', ARRAY['OTHER']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Ciclismo
    ('178', 'ABS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CORE', 'MULTI'), -- Bicho muerto
    ('184', 'BACK', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'HINGE', 'MULTI'), -- Peso muerto convencional
    ('185', 'CHEST', ARRAY['BARBELL', 'BENCH']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de banca declinado con barra
    ('186', 'CHEST', ARRAY['BENCH', 'DUMBBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de banca declinado con mancuernas
    ('194', 'CHEST', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Fondos en paralelas
    ('197', 'ARMS', ARRAY['BENCH']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Fondos entre bancos
    ('202', 'ARMS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Curl concentrado con mancuerna
    ('203', 'LEGS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla goblet con mancuerna
    ('204', 'ARMS', ARRAY['DUMBBELL', 'INCLINE_BENCH']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Curl inclinado con mancuernas
    ('205', 'LEGS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'LUNGE', 'MULTI'), -- Zancadas con mancuernas
    ('206', 'LEGS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'LUNGE', 'MULTI'), -- Zancadas caminando con mancuernas
    ('222', 'SHOULDERS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Face pull en polea
    ('238', 'CHEST', ARRAY['DUMBBELL', 'BENCH']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Aperturas con mancuernas
    ('245', 'ARMS', ARRAY['BENCH', 'DUMBBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Press francés con mancuernas
    ('246', 'ARMS', ARRAY['BENCH', 'EZ_BAR']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Press francés con barra Z
    ('256', 'SHOULDERS', ARRAY['BARBELL', 'DUMBBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Elevaciones frontales
    ('257', 'LEGS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla frontal con barra
    ('265', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'HINGE', 'SINGLE'), -- Puente de glúteos
    ('272', 'ARMS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Curl martillo con mancuernas
    ('279', 'ARMS', ARRAY['OTHER']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Fortalecedor de agarre
    ('282', 'SHOULDERS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Flexiones en parada de manos
    ('283', 'ABS', ARRAY['PULL_UP_BAR']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Elevación de piernas colgado
    ('294', 'LEGS', ARRAY['BARBELL', 'BENCH']::"EquipamientoDeEjercicio"[], 'HINGE', 'SINGLE'), -- Hip thrust con barra
    ('301', 'BACK', ARRAY['BENCH']::"EquipamientoDeEjercicio"[], 'HINGE', 'SINGLE'), -- Hiperextensiones lumbares
    ('308', 'CHEST', ARRAY['DUMBBELL', 'INCLINE_BENCH']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Aperturas con mancuernas en banco inclinado
    ('310', 'BACK', ARRAY['DUMBBELL', 'INCLINE_BENCH']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo con mancuernas en banco inclinado
    ('320', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Saltos de tijera
    ('323', 'CHEST', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Cruce de poleas
    ('348', 'SHOULDERS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Elevaciones laterales con mancuernas
    ('355', 'BACK', ARRAY['CABLE', 'MACHINE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Jalón al pecho
    ('365', 'LEGS', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'HINGE', 'SINGLE'), -- Curl femoral acostado
    ('366', 'LEGS', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'HINGE', 'SINGLE'), -- Curl femoral sentado
    ('369', 'LEGS', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'SQUAT', 'SINGLE'), -- Extensión de cuádriceps en máquina
    ('371', 'LEGS', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Prensa de piernas
    ('377', 'ABS', ARRAY['MAT']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Elevación de piernas acostado
    ('386', 'CHEST', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Flexiones diamante
    ('394', 'BACK', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo sentado en polea baja
    ('448', 'BACK', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo Pendlay
    ('454', 'ARMS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Flexiones en pica
    ('456', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla a una pierna (pistol)
    ('458', 'ABS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CORE', 'MULTI'), -- Plancha sobre antebrazos
    ('465', 'ARMS', ARRAY['EZ_BAR', 'BENCH']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Curl en banco Scott
    ('475', 'BACK', ARRAY['PULL_UP_BAR']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Dominadas con agarre prono
    ('495', 'ARMS', ARRAY['BARBELL', 'DUMBBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Curl invertido
    ('507', 'LEGS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'HINGE', 'MULTI'), -- Peso muerto rumano con barra
    ('513', 'BACK', ARRAY['BARBELL', 'MACHINE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo en T
    ('527', 'CARDIO', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Correr
    ('530', 'CARDIO', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Correr en cinta
    ('537', 'CHEST', ARRAY['DUMBBELL', 'INCLINE_BENCH']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press inclinado con mancuernas
    ('538', 'CHEST', ARRAY['BARBELL', 'INCLINE_BENCH']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de banca inclinado con barra
    ('543', 'SHOULDERS', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de hombros en máquina
    ('545', 'ABS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Tijeras
    ('566', 'SHOULDERS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de hombros con barra
    ('567', 'SHOULDERS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de hombros con mancuernas
    ('569', 'SHOULDERS', ARRAY['MACHINE', 'BARBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de hombros en máquina Smith
    ('571', 'SHOULDERS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Encogimientos de hombros con barra
    ('572', 'SHOULDERS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Encogimientos de hombros con mancuernas
    ('580', 'ABS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CORE', 'MULTI'), -- Plancha lateral
    ('590', 'CALVES', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Elevación de talones sentado
    ('591', 'ABS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Abdominales completos
    ('614', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla con salto
    ('615', 'LEGS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla trasera con barra
    ('622', 'CALVES', ARRAY['BODYWEIGHT', 'MACHINE']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Elevación de talones de pie
    ('627', 'LEGS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'HINGE', 'MULTI'), -- Peso muerto con piernas rígidas
    ('630', 'LEGS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'HINGE', 'MULTI'), -- Peso muerto sumo
    ('632', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla sumo
    ('636', 'BACK', ARRAY['MAT']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Superman
    ('650', 'LEGS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Thruster con barra
    ('655', 'ARMS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Patada de tríceps con mancuerna
    ('659', 'ARMS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Extensión de tríceps en polea
    ('661', 'ARMS', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Tríceps en máquina
    ('684', 'BACK', ARRAY['CABLE', 'MACHINE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Jalón al pecho con agarre supino
    ('693', 'SHOULDERS', ARRAY['EZ_BAR']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo al mentón con barra Z
    ('694', 'SHOULDERS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo al mentón con mancuernas
    ('723', 'BACK', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Jalón al pecho con agarre ancho
    ('822', 'SHOULDERS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Aperturas posteriores en polea
    ('910', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'HINGE', 'SINGLE'), -- Curl nórdico
    ('960', 'LEGS', ARRAY['KETTLEBELL']::"EquipamientoDeEjercicio"[], 'HINGE', 'MULTI'), -- Swing con kettlebell
    ('962', 'CARDIO', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Elíptico
    ('977', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla al cajón
    ('978', 'ABS', ARRAY['PULL_UP_BAR']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Elevación de rodillas en barra
    ('981', 'LEGS', ARRAY['BENCH']::"EquipamientoDeEjercicio"[], 'LUNGE', 'MULTI'), -- Subidas al cajón
    ('983', 'CARDIO', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Rodillas arriba
    ('984', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'LUNGE', 'MULTI'), -- Zancadas con peso corporal
    ('990', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'HINGE', 'SINGLE'), -- Patada de glúteo en cuadrupedia
    ('993', 'CARDIO', ARRAY['OTHER']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Saltar la soga
    ('994', 'ARMS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Círculos de brazos
    ('996', 'CHEST', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Escaladores
    ('999', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'LUNGE', 'MULTI'), -- Zancadas hacia atrás
    ('1001', 'CHEST', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CORE', 'MULTI'), -- Plancha alta
    ('1002', 'BACK', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'MULTI'), -- Postura del niño
    ('1003', 'BACK', ARRAY['KETTLEBELL']::"EquipamientoDeEjercicio"[], 'HINGE', 'MULTI'), -- Peso muerto con kettlebell
    ('1006', 'BACK', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Retracción cervical
    ('1084', 'CHEST', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Press de pecho en el piso con mancuernas
    ('1093', 'CARDIO', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Remo ergómetro
    ('1104', 'CARDIO', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Caminata
    ('1111', 'CHEST', ARRAY['BENCH', 'INCLINE_BENCH']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Flexiones inclinadas
    ('1131', 'LEGS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'HINGE', 'SINGLE'), -- Patada de glúteo en polea
    ('1136', 'BACK', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Jalón al pecho con agarre neutro
    ('1185', 'ARMS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Extensión de tríceps en polea con soga
    ('1188', 'ABS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Flexión lateral de tronco con mancuerna
    ('1192', 'ARMS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Curl de bíceps alternado con mancuernas
    ('1193', 'ABS', ARRAY['DUMBBELL', 'MAT', 'SWISS_BALL']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Giro ruso
    ('1194', 'ABS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'CORE', 'MULTI'), -- Press Pallof
    ('1198', 'CHEST', ARRAY['BODYWEIGHT', 'BARBELL']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo invertido
    ('1200', 'CALVES', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Elevación de puntas de pie
    ('1202', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Abducción de cadera acostado de lado
    ('1218', 'ARMS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Flexiones de brazos con rodillas apoyadas
    ('1239', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Estiramiento de gemelos de pie
    ('1244', 'BACK', ARRAY['MAT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Gato-vaca (movilidad de la columna)
    ('1270', 'CHEST', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Aperturas en polea baja
    ('1312', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla con peso corporal
    ('1336', 'ARMS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Extensión de tríceps sobre la cabeza con mancuerna
    ('1373', 'CARDIO', ARRAY['BODYWEIGHT', 'OTHER']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Saltos al cajón
    ('1378', 'SHOULDERS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Elevación lateral en polea a un brazo
    ('1380', 'BACK', ARRAY['BAND']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Aperturas con banda elástica
    ('1392', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'HINGE', 'MULTI'), -- Buenos días con peso corporal
    ('1393', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Estiramiento de isquiotibiales a una pierna
    ('1407', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'LUNGE', 'MULTI'), -- Sentadilla cosaca
    ('1408', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla isométrica contra la pared
    ('1412', 'ABS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Abdominales en bicicleta
    ('1414', 'LEGS', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla hack en máquina
    ('1440', 'SHOULDERS', ARRAY['BARBELL']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Push press
    ('1450', 'BACK', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Postura de la cobra
    ('1452', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Estiramiento de rodilla al pecho
    ('1465', 'ARMS', ARRAY['DUMBBELL', 'INCLINE_BENCH']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Curl araña
    ('1513', 'ARMS', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Extensión de tríceps sobre la cabeza en polea
    ('1524', 'CARDIO', ARRAY['OTHER']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Cuerdas de batalla
    ('1525', 'CARDIO', ARRAY['OTHER']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Lanzamiento de balón medicinal al piso
    ('1529', 'ABS', ARRAY['PULL_UP_BAR']::"EquipamientoDeEjercicio"[], 'CORE', 'MULTI'), -- Pies a la barra
    ('1551', 'CHEST', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'PUSH', 'MULTI'), -- Flexiones de brazos
    ('1572', 'ABS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CORE', 'MULTI'), -- Bird dog
    ('1573', 'ABS', ARRAY['OTHER']::"EquipamientoDeEjercicio"[], 'CORE', 'MULTI'), -- Rueda abdominal
    ('1584', 'CARDIO', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Trote en el lugar
    ('1618', 'CARDIO', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI'), -- Bicicleta fija
    ('1621', 'BACK', ARRAY['BENCH', 'CABLE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo unilateral en polea
    ('1652', 'LEGS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'HINGE', 'MULTI'), -- Peso muerto rumano con mancuernas
    ('1654', 'SHOULDERS', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'PUSH', 'SINGLE'), -- Elevación lateral en máquina
    ('1679', 'SHOULDERS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'MULTI'), -- Ángeles en la pared
    ('1696', 'BACK', ARRAY['PULL_UP_BAR']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Dominadas con agarre neutro
    ('1706', 'LEGS', ARRAY['DUMBBELL', 'BENCH']::"EquipamientoDeEjercicio"[], 'LUNGE', 'MULTI'), -- Sentadilla búlgara con mancuernas
    ('1713', 'CHEST', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Estiramiento de pectoral en el marco de la puerta
    ('1715', 'SHOULDERS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Rotación externa de hombro con mancuerna
    ('1726', 'BACK', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PULL', 'SINGLE'), -- Jalón con brazos rectos en polea
    ('1736', 'LEGS', ARRAY['DUMBBELL']::"EquipamientoDeEjercicio"[], 'HINGE', 'MULTI'), -- Peso muerto a una pierna con mancuerna
    ('1747', 'LEGS', ARRAY['MACHINE', 'BARBELL']::"EquipamientoDeEjercicio"[], 'SQUAT', 'MULTI'), -- Sentadilla en máquina Smith
    ('1748', 'LEGS', ARRAY['MACHINE']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Abducción de cadera en máquina
    ('1772', 'ABS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'CORE', 'SINGLE'), -- Crunch inverso
    ('1822', 'BACK', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'MULTI'), -- Libro abierto
    ('1823', 'ABS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Almeja (clamshell)
    ('1843', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Estiramiento de mariposa
    ('1873', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Estiramiento de cuádriceps
    ('1928', 'BACK', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Remo sentado con agarre en V
    ('1929', 'BACK', ARRAY['BAND', 'PULL_UP_BAR']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Dominadas asistidas con banda elástica
    ('1959', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Estiramiento del piriforme sentado
    ('1960', 'LEGS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'SINGLE'), -- Estiramiento del flexor de cadera con pie trasero elevado
    ('1966', 'ABS', ARRAY['BODYWEIGHT']::"EquipamientoDeEjercicio"[], 'OTHER', 'MULTI'), -- Rotación torácica en media rodilla
    ('1972', 'BACK', ARRAY['CABLE']::"EquipamientoDeEjercicio"[], 'PULL', 'MULTI'), -- Jalón al pecho a un brazo
    ('2480', 'CARDIO', ARRAY['OTHER']::"EquipamientoDeEjercicio"[], 'CARDIO', 'MULTI') -- Natación continua a ritmo suave
  ) AS n("id_externo", "grupo", "equipamiento", "patron", "articulaciones")
  JOIN "item_externo_de_catalogo" i ON i."proveedor" = 'WGER' AND i."id_externo" = n."id_externo"
 WHERE v."ejercicio_id" = i."ejercicio_id"
   AND NOT EXISTS (SELECT 1 FROM "version_de_ejercicio" s WHERE s."predecesora_id" = v."id");
