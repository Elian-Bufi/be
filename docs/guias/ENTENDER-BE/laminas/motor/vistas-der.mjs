// Las vistas del DER: cada uno de los 118 modelos (113 de la tesis y los 5 de Administración, que se suman en DER-15) de prisma/schema.prisma está en una sola vista. La agrupación sigue
// los dominios del 06 (M-01 identidad, M-02 profesional, M-03 vínculo, B-04 proceso, B-07 nutrición, B-08 entrenamiento,
// B-10 antropometría, CAP-DAT información) y las extensiones de cada paquete. La vista general (DER-00) dibuja estas
// mismas vistas como paquetes, con las relaciones que cruzan de una a otra.
export const VISTAS_DER = [
  {
    id: 'DER-01',
    titulo: 'Identidad, acceso y sesión',
    corto: 'Identidad y sesión',
    modelos: ['Identidad', 'PerfilPropio', 'VersionDePerfilPropio', 'MetodoDeAcceso', 'CredencialLocal', 'Sesion', 'ReanudacionDeSesion', 'ControlDeSesion', 'SolicitudDeCierreDeCuenta', 'RegistroDeSupresion'],
  },
  {
    id: 'DER-02',
    titulo: 'Profesional, capacidad y proceso operativo',
    corto: 'Profesional y proceso',
    modelos: ['PerfilProfesional', 'VerificacionProfesional', 'Habilitacion', 'EventoDeVerificacion', 'CapacidadProfesional', 'ProcesoOperativo', 'EventoDeProceso', 'ProximaRevision'],
  },
  {
    id: 'DER-03',
    titulo: 'Vínculo e invitación',
    corto: 'Vínculo e invitación',
    modelos: ['InvitacionDeVinculo', 'ResolucionDeInvitacion', 'SolicitudDeVinculo', 'Vinculo', 'AlcanceDeVinculo'],
  },
  {
    id: 'DER-04',
    titulo: 'Actos, consentimiento y autorización',
    corto: 'Consentimiento y autorización',
    modelos: ['VersionDeTexto', 'ActoRegistrable', 'Consentimiento', 'VersionDeConsentimiento', 'EventoDeVinculo', 'DecisionDeAcceso'],
  },
  {
    id: 'DER-05',
    titulo: 'Nutrición · catálogo, recetas e importación',
    corto: 'Catálogo nutricional y recetas',
    modelos: ['ElementoDeCatalogoNutricional', 'VersionDeElementoNutricional', 'ItemExternoDeCatalogo', 'NombreAlternativoDeAlimento', 'RetiroDeNombreAlternativoDeAlimento', 'CandidatoDeImportacion', 'ResolucionDeCandidato', 'Receta', 'VersionDeReceta', 'AsociacionDeImagenDeReceta', 'AlimentoHabitual', 'ComidaHabitual'],
  },
  {
    id: 'DER-06',
    titulo: 'Nutrición · evaluación, objetivo y plan',
    corto: 'Plan nutricional',
    modelos: ['EvaluacionNutricional', 'ObjetivoNutricional', 'VersionDeObjetivoNutricional', 'PlanNutricional', 'VersionDePlanNutricional', 'InstantaneaDePlanNutricional', 'PlantillaDePlanNutricional', 'VersionDePlantillaDePlanNutricional'],
  },
  {
    id: 'DER-07',
    titulo: 'Nutrición · registro y revisión',
    corto: 'Registro nutricional',
    modelos: ['IngestaNutricional', 'CorreccionDeIngesta', 'AnulacionDeIngesta', 'RectificacionDeCantidades', 'EvidenciaVisualDeIngesta', 'RevisionNutricional', 'AplicacionDeRevision', 'EventoDeNutricion'],
  },
  {
    id: 'DER-08',
    titulo: 'Entrenamiento · catálogo y plantillas',
    corto: 'Catálogo de ejercicios',
    modelos: ['EjercicioDeCatalogo', 'VersionDeEjercicio', 'NombreAlternativoDeEjercicio', 'RetiroDeNombreAlternativoDeEjercicio', 'AsociacionDeImagenDeEjercicio', 'EjercicioHabitual', 'SesionHabitual', 'PlantillaDePlanDeEntrenamiento', 'VersionDePlantillaDePlanDeEntrenamiento'],
  },
  {
    id: 'DER-09',
    titulo: 'Entrenamiento · evaluación, objetivo y plan',
    corto: 'Plan de entrenamiento',
    modelos: ['EvaluacionDeEntrenamiento', 'CitaDeRespuestaEnEvaluacionDeEntrenamiento', 'ObjetivoDeEntrenamiento', 'VersionDeObjetivoDeEntrenamiento', 'PlanDeEntrenamiento', 'VersionDePlanDeEntrenamiento', 'InstantaneaDePlanDeEntrenamiento'],
  },
  {
    id: 'DER-10',
    titulo: 'Entrenamiento · ejecución y revisión',
    corto: 'Ejecución de entrenamiento',
    modelos: ['BorradorDeEjecucionDeEntrenamiento', 'EjecucionDeEntrenamiento', 'CorreccionDeEjecucionDeEntrenamiento', 'EventoDeTiempoDeEntrenamiento', 'RevisionDeEntrenamiento', 'AplicacionDeRevisionDeEntrenamiento', 'EventoDeEntrenamiento'],
  },
  {
    id: 'DER-11',
    titulo: 'Antropometría y cálculos',
    corto: 'Antropometría',
    modelos: ['EspecificacionAntropometrica', 'RetiroDeEspecificacion', 'VersionDeEspecificacionAntropometrica', 'EvaluacionAntropometrica', 'MedicionAntropometrica', 'CorreccionDeMedicion', 'AnulacionDeMedicion', 'EjecucionDeCalculo', 'ReferenciaDeCalculo', 'EntradaDeCalculo', 'EventoDeAntropometria'],
  },
  {
    id: 'DER-12',
    titulo: 'Información pertinente',
    corto: 'Información pertinente',
    modelos: ['PlantillaDeFormulario', 'VersionDePlantillaDeFormulario', 'SolicitudDeFormulario', 'RespuestaDeFormulario', 'RectificacionDeRespuestaDeFormulario', 'EventoDeFormulario'],
  },
  {
    id: 'DER-13',
    titulo: 'Seguimiento, novedades y avisos',
    corto: 'Seguimiento y avisos',
    modelos: ['NotaDeCoordinacion', 'DestinatarioDeNota', 'ReferenciaDeNota', 'VistaDeAnalisis', 'ResultadoTvcc30', 'Novedad', 'LecturaDeNovedad', 'SuscripcionPush', 'AvisoPush', 'PreferenciaDeRecordatorio'],
  },
  {
    id: 'DER-14',
    titulo: 'Plataforma · historia, auditoría y medios',
    corto: 'Historia, auditoría y medios',
    modelos: ['EventoDeDominio', 'RegistroDeAuditoria', 'RegistroDeIdempotencia', 'Medio', 'ContenidoDeMedio', 'CapacidadDeClienteDeclarada'],
  },
  {
    id: 'DER-15',
    titulo: 'Administración y segundo factor',
    corto: 'Administración',
    modelos: ['RolAdministrativo', 'CodigoDeIncorporacion', 'FactorTotp', 'CodigoDeRecuperacion', 'SegundoFactorDeSesion'],
  },
];

export const vistaDe = (modelo) => VISTAS_DER.find((v) => v.modelos.includes(modelo))?.id ?? null;
