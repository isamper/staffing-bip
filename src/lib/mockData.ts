import type {
  Profile,
  Project,
  VacationRequest,
  ProjectAssignment,
  ProjectLike,
  Notification,
  ExperienceEntry,
} from './types'

function c(
  id: string,
  name: string,
  role_title: string,
  seniority: Profile['seniority'],
  skills: string[],
  available_from: string | null,
  practice_area: string | null = null,
  internship_end_date: string | null = null,
  cv: { bio?: string; education?: string; languages?: string; years_of_experience?: number; certifications?: string[]; experience?: ExperienceEntry[] } = {},
): Profile {
  return {
    id, name, role_title, seniority, practice_area, skills,
    available_from,
    internship_start_date: null, internship_end_date,
    user_role: 'consultant', is_active: true, created_at: '2025-01-01T00:00:00Z',
    bio: cv.bio ?? null,
    education: cv.education ?? null,
    languages: cv.languages ?? null,
    years_of_experience: cv.years_of_experience ?? null,
    certifications: cv.certifications ?? [],
    experience: cv.experience ?? [],
  }
}

export const mockConsultants: Profile[] = [
  // Senior Partners
  c('c1', 'Hernando Baquero', 'Socio Senior', 'Senior Partner',
    ['Transformación Digital', 'Excelencia Operativa', 'Estrategia de TI', 'Estrategia Corporativa', 'Business Intelligence', 'Post-fusión e Integración'],
    '2026-12-31', null, null, {
      bio: 'Hernando tiene más de 20 años de experiencia en transformación digital, excelencia operativa, planificación estratégica de negocios y TI y gestión de proyectos complejos. Antes de fundar Advantis en 2003, fue consultor en Booz Allen Hamilton y Gerente de una empresa de consultoría colombiana.',
      education: 'Ingeniero Industrial, Universidad de los Andes · MBA, INSEAD',
      languages: 'Español, Inglés',
      years_of_experience: 20,
      experience: [
        { id: 'e1a', title: 'Transformación Digital y Tecnologías de la Información', client: 'Sector Financiero, LATAM', period: '2003 – presente', description: 'Soporte en Transformación Digital — mejora de la experiencia del cliente, modernización de aplicaciones heredadas y excelencia operativa. Definición de visión y hoja de ruta de TI para más de 100 empresas de diversas industrias. Due Diligence de TI para empresas tecnológicas, bancos y fondos de pensiones.' },
        { id: 'e1b', title: 'Transformación Organizacional', client: 'Banca y Sector Real', period: '2003 – presente', description: 'Integración post-fusión de bancos, fondos de pensiones y empresas de consumo con énfasis en TI. Evaluación y diseño de esquemas de servicios compartidos. Rediseño y mejora de la eficacia operativa.' },
        { id: 'e1c', title: 'Excelencia Operativa y Organizacional', client: 'Múltiples industrias', period: '2003 – presente', description: 'Evaluación de capacidades operativas, diseño y transformación del modelo operativo y tecnológico. Implantación de estrategias y sistemas de inteligencia de negocios.' },
        { id: 'e1d', title: 'Consultor, Práctica de TI', client: 'Booz Allen Hamilton', period: '1998 – 2003', description: 'Proyectos de TI para clientes en múltiples industrias en Colombia y América Latina.' },
      ],
    }),
  // Partners
  c('c2', 'John Jairo Romero', 'Socio', 'Partner',
    ['Transformación Digital', 'Estrategia de TI', 'Ciberseguridad', 'Post-fusión e Integración', 'Sector Financiero', 'Mejora de Procesos'],
    '2026-12-31', 'IT / Digital', null, {
      bio: 'John Jairo ha dedicado su carrera de más de 27 años en consultoría a ayudar a empresas en múltiples industrias a transformar su negocio mediante tecnología e innovación digital.',
      education: 'Ingeniero de Sistemas, Universidad de Los Andes',
      languages: 'Español, Inglés',
      years_of_experience: 27,
    }),
  c('c3', 'Juan Fernando Forero', 'Socio', 'Partner',
    ['Estrategia de TI', 'Arquitectura de Sistemas', 'Gestión de Proyectos', 'Arquitectura de Datos'],
    '2026-08-21', 'Strategy & Technology', null, {
      bio: 'Juan Fernando cuenta con más de 30 años de experiencia en consultoría gerencial para resolver asuntos estratégicos de TI — planeación y gestión de TI, arquitectura, selección de soluciones y dirección de proyectos de implementación en América Latina.',
      education: 'Ingeniero de Sistemas y Computación, Universidad de Los Andes',
      languages: 'Español, Inglés',
      years_of_experience: 30,
      experience: [
        { id: 'e3a', title: 'Planeación y Gestión de TI', client: 'Sector Financiero y Real, Norte de América Latina', period: '1994 – presente', description: 'Definición de estrategias de TI, evaluación de capacidades y diseño de modelos de gestión para grandes corporaciones. Más de 30 proyectos en Colombia, Panamá, Ecuador y Venezuela.' },
        { id: 'e3b', title: 'Arquitectura de TI y Selección de Soluciones', client: 'Banca, Seguros, Retail', period: '1994 – presente', description: 'Diseño de arquitecturas tecnológicas y evaluación de plataformas. Estructuración y dirección de procesos de selección de software ERP, CRM y core bancario.' },
        { id: 'e3c', title: 'Gerencia de Proyectos de Implementación', client: 'Múltiples clientes LATAM', period: '1994 – presente', description: 'Dirección de proyectos de implementación de soluciones tecnológicas complejas. Diseño y puesta en marcha de integraciones entre sistemas.' },
      ],
    }),
  // Director
  c('c4', 'Henry Jaimes', 'Director', 'Director',
    ['Estrategia de TI', 'Arquitectura de Sistemas', 'Transformación Digital', 'Diseño Organizacional', 'Gestión de Proyectos', 'Due Diligence de TI'],
    '2026-11-30', null, null, {
      bio: 'Henry tiene una amplia experiencia en consultoría en estrategia de tecnología y negocios, arquitectura de TI, implementación de estrategias de transformación digital, diseño organizacional y metodologías ágiles.',
      education: 'Ingeniero de Sistemas, Universidad de Los Andes · Magíster en Tecnologías de la Información para el Negocio, Universidad de Los Andes',
      languages: 'Español, Inglés',
      certifications: ['Scrum Master Certificado'],
      experience: [
        { id: 'e4a', title: 'Estrategia de Negocios y de TI', client: 'Sector Financiero y Telecomunicaciones', period: '2010 – presente', description: 'Definición de estrategias de TI alineadas al negocio, evaluación de capacidades digitales y diseño de hojas de ruta de transformación.' },
        { id: 'e4b', title: 'Arquitectura de TI y Diseño Organizacional', client: 'Banca, Seguros, Gobierno', period: '2010 – presente', description: 'Diseño de arquitecturas empresariales, evaluación de plataformas tecnológicas y modelos de gestión de TI. Due diligence técnicos en procesos de fusiones y adquisiciones.' },
        { id: 'e4c', title: 'Transformación Digital y Metodologías Ágiles', client: 'Múltiples industrias', period: '2015 – presente', description: 'Liderazgo de programas de transformación digital y adopción de metodologías ágiles (Scrum, SAFe) en grandes organizaciones.' },
      ],
    }),
  // Senior Managers
  c('c5', 'Andrés Cubillos', 'Gerente Senior', 'Senior Manager',
    ['Excelencia Operativa', 'Estrategia de TI', 'Arquitectura de Sistemas', 'Gestión de Proyectos', 'Mejora de Procesos'],
    '2026-05-29', null, null, {
      bio: 'Andrés tiene más de 12 años de experiencia enfocándose en dirección de proyectos complejos, planeación de TI, modelos de gestión y transformación de modelos operativos para diversas líneas de negocio.',
      education: 'Ingeniero, Universidad de Los Andes',
      years_of_experience: 12,
      experience: [
        { id: 'e5a', title: 'Excelencia Operacional y Transformación de Modelos Operativos', client: 'Sector Financiero y Salud', period: '2018 – presente', description: 'Transformación de modelos operativos para procesos financieros, atención al cliente, comercial y back office (shared services). Optimización de procesos con metodologías Lean y Six Sigma.' },
        { id: 'e5b', title: 'Estrategia de TI y Arquitectura Empresarial', client: 'Múltiples industrias', period: '2018 – presente', description: 'Planeación de TI, diseño de modelos de gestión y evaluación de capacidades digitales. Gestión ágil de proyectos de implementación de software.' },
        { id: 'e5c', title: 'Gerente y Consultor Senior', client: 'Ernst & Young', period: '2012 – 2018', description: 'Proyectos estratégicos, organizacionales y de tecnología en múltiples industrias.' },
      ],
    }),
  c('c6', 'Jaime Barco', 'Experto Datos y Analítica', 'Senior Manager',
    ['Análisis de Datos', 'Business Intelligence', 'Machine Learning', 'Arquitectura de Datos'],
    '2026-12-31', null, null, {
      bio: 'Jaime ha participado en más de 80 proyectos relacionados con Data y Analítica. Especialista en técnicas de minería de datos, calidad de datos e implantación de sistemas de inteligencia artificial.',
      education: 'Ingeniero de Sistemas, Universidad Autónoma de Manizales · Especialización en Desarrollo Gerencial, Universidad Autónoma · PDD, INALDE',
      languages: 'Español, Portugués',
      years_of_experience: 20,
      experience: [
        { id: 'e6a', title: 'Estrategia y Gobierno de Datos', client: 'Sector Financiero y Retail, LATAM', period: '2004 – presente', description: 'Diseño e implantación de estrategias de calidad de datos, gobierno de datos y arquitecturas analíticas para más de 80 proyectos en Colombia, Brasil y América Latina.' },
        { id: 'e6b', title: 'Business Intelligence e Inteligencia Artificial', client: 'Banca, Seguros, Retail', period: '2004 – presente', description: 'Implantación de sistemas de BI y plataformas de IA. Minería de datos aplicada a riesgo crediticio, fraude, fidelización de clientes y optimización de operaciones.' },
        { id: 'e6c', title: 'Calidad de Datos y Master Data Management', client: 'Múltiples industrias', period: '2004 – presente', description: 'Diagnóstico, diseño e implementación de marcos de calidad de datos y MDM. Definición de roles, procesos y herramientas de gestión de datos maestros.' },
      ],
    }),
  c('c7', 'Carla Villaverde', 'Directora Talento Humano', 'Senior Manager',
    ['Diseño Organizacional', 'Gestión del Cambio', 'Liderazgo de Equipos', 'Gestión de Stakeholders'],
    '2026-07-31', null, null, {
      bio: 'Carla cuenta con más de 15 años de experiencia en talento humano, trabajando en la definición e implementación de estrategias que apalanquen los objetivos del negocio e incrementen los resultados de los equipos.',
      languages: 'Español, Inglés',
      years_of_experience: 15,
    }),
  c('c8', 'Felipe Estrada', 'Gerente Senior', 'Senior Manager',
    ['Transformación Digital', 'Estrategia de TI', 'Arquitectura de Datos', 'Arquitectura de Sistemas', 'Estrategia Corporativa'],
    '2026-12-31', null, null, {
      bio: 'Felipe tiene 10+ años de experiencia. Anteriormente trabajó en IBM Colombia como consultor de TI y como líder de TI para aplicaciones y estrategias de mercadeo digital.',
      education: 'Ingeniero en Sistemas e Informática, Universidad de los Andes',
      languages: 'Español, Inglés',
      years_of_experience: 10,
      certifications: ['Scrum Master Certificado'],
    }),
  c('c9', 'Iván Melo', 'Gerente Senior – Especialista Arquitectura TI', 'Senior Manager',
    ['Arquitectura de Sistemas', 'Transformación Digital', 'Estrategia de TI', 'Sector Financiero'],
    '2026-08-21', null, null, {
      bio: 'Iván Mauricio tiene 15+ años de experiencia en proyectos de arquitectura empresarial y asuntos estratégicos de TI, con amplia experiencia en transformación digital y selección de software en instituciones financieras en América Latina.',
      education: 'Máster en Ingeniería e Ingeniero de Sistemas y Computación, Universidad de Los Andes',
      languages: 'Español, Inglés',
      years_of_experience: 15,
      experience: [
        { id: 'e9a', title: 'Arquitectura Empresarial y de TI', client: 'Instituciones Financieras, LATAM', period: '2010 – presente', description: 'Diseño de arquitecturas empresariales y tecnológicas para bancos, aseguradoras y fondos de pensiones en Colombia, Ecuador, Perú y México. Definición de hojas de ruta de evolución tecnológica.' },
        { id: 'e9b', title: 'Selección de Software y Transformación Digital', client: 'Sector Financiero y Real', period: '2010 – presente', description: 'Dirección de procesos de selección e implementación de soluciones core bancario, ERP y plataformas digitales. Evaluación de arquitecturas cloud y definición de estrategias de migración.' },
      ],
    }),
  // Managers
  c('c10', 'Magda Patiño', 'Especialista en Gestión de Proyectos', 'Manager',
    ['Gestión de Proyectos', 'Gestión del Cambio', 'ERP', 'Mejora de Procesos'],
    '2026-08-21', 'Implementation', null, {
      bio: 'Magda es Especialista de Gestión de Proyectos con más de 25 años de experiencia en implementación de soluciones informáticas y estrategias de negocio para empresas públicas y privadas en múltiples sectores.',
      education: 'Ingeniera de Sistemas, Universidad de Los Andes',
      years_of_experience: 25,
      certifications: ['Scrum Master Certificada'],
    }),
  c('c11', 'Alejandro Manrique', 'Gerente', 'Manager',
    ['Estrategia Corporativa', 'Análisis de Negocio', 'Modelamiento Financiero'],
    null),
  c('c12', 'John Casallas', 'Gerente', 'Manager',
    ['Gestión de Proyectos', 'Estrategia de TI', 'Arquitectura de Sistemas', 'Transformación Digital', 'RPA'],
    '2026-11-30', null, null, {
      bio: 'John cuenta con 13+ años de experiencia. Sus principales áreas de especialización son gestión de proyectos de implementación de software, arquitectura empresarial y transformación digital.',
      education: 'Ingeniero de Sistemas, Universidad de Los Andes · Magíster en Ingeniería de Sistemas con énfasis en Arquitectura Empresarial, Universidad de Los Andes',
      years_of_experience: 13,
    }),
  c('c13', 'Felipe Mediorreal', 'Gerente', 'Manager',
    ['Modelo Operativo', 'Mejora de Procesos'],
    null),
  c('c14', 'Santiago Serna', 'Gerente', 'Manager',
    ['Estrategia Corporativa', 'Transformación Digital', 'Excelencia Operativa', 'Gestión del Cambio'],
    '2026-12-31', null, null, {
      bio: 'Santiago Serna cuenta con más de 8 años de experiencia en proyectos de estrategia de negocios, transformación digital, gestión de tecnología y excelencia operacional.',
      education: 'MBA, Duke University · Ingeniero Industrial y Civil, Universidad de Los Andes',
      languages: 'Español, Inglés',
      years_of_experience: 8,
    }),
  c('c15', 'Angélica Tarazona', 'Gerente', 'Manager',
    ['Diseño Organizacional', 'Gestión del Cambio', 'Modelamiento Financiero', 'Liderazgo de Equipos'],
    '2026-08-21', null, null, {
      education: 'Magíster en Finanzas, Universidad de Los Andes · Administradora y Economista, Universidad Metropolitana (Caracas)',
    }),
  // Senior Associates
  c('c16', 'Andrea Rosales', 'Asociado Senior', 'Senior Associate',
    ['Análisis de Negocio', 'Mejora de Procesos', 'Análisis de Datos'],
    '2026-12-31'),
  c('c17', 'Guillermo Ferro', 'Asociado Senior', 'Senior Associate',
    ['Estrategia de TI', 'Arquitectura de Sistemas', 'Transformación Digital'],
    '2026-11-30', null, null, {
      education: 'Magíster en Arquitectura de TI, Universidad de los Andes',
    }),
  c('c18', 'Diego Castro', 'Asociado', 'Senior Associate',
    ['Estrategia de TI', 'Transformación Digital', 'Gestión de Proyectos', 'Mejora de Procesos', 'Estrategia Corporativa'],
    null, null, null, {
      bio: 'Diego Castro cuenta con 4 años de experiencia en proyectos de estrategia de tecnología y negocio, estrategia organizacional, implementación de metodologías ágiles y lean digital.',
      languages: 'Español, Inglés',
      years_of_experience: 4,
    }),
  c('c19', 'Raúl Aular', 'Asociado', 'Associate',
    ['Estrategia de TI', 'Estrategia Corporativa', 'Mejora de Procesos', 'ERP', 'Retail'],
    '2026-11-30', null, null, {
      bio: 'Raúl cuenta con experiencia en implementación de modelos de gestión de TI, rediseño e implementación de procesos y planes de turnaround en retailers de diferentes industrias.',
      languages: 'Español, Inglés, Portugués',
    }),
  c('c20', 'Lina Gutiérrez', 'Asociado Senior', 'Senior Associate',
    ['Gestión del Cambio', 'Comunicación Ejecutiva', 'Facilitación'],
    null),
  c('c21', 'Juan David Figueroa', 'Asociado Sr', 'Senior Associate',
    ['Estrategia Corporativa', 'Transformación Digital', 'Mejora de Procesos', 'Modelo Operativo', 'Modelamiento Financiero'],
    '2026-05-29', null, null, {
      bio: 'Juan David cuenta con más de 6 años de experiencia en estrategia de negocio y tecnología, transformación digital y optimización de procesos. Antes de BIP fue consultor en Accenture y Globant.',
      education: 'Economista, Pontificia Universidad Javeriana',
      languages: 'Español, Inglés',
      years_of_experience: 6,
    }),
  // Associates
  c('c22', 'Antonio Pérez', 'Asociado', 'Associate',
    ['Transformación Digital', 'ERP', 'CRM', 'Estrategia de TI', 'Post-fusión e Integración'],
    '2026-12-31', null, null, {
      bio: 'Antonio tiene más de 6 años de experiencia en consultoría estratégica y de operaciones en los sectores de energía, utilities y servicios financieros.',
      languages: 'Español (nativo), Inglés C1',
      years_of_experience: 6,
    }),
  c('c23', 'Santiago Restrepo', 'Consultor Senior', 'Associate',
    ['Transformación Digital', 'Gestión de Proyectos', 'Estrategia de TI', 'Excelencia Operativa', 'Estrategia Corporativa'],
    '2026-11-30', null, null, {
      bio: 'Santiago cuenta con 3 años de experiencia en proyectos de transformación digital, implementación de software, definición de estrategia de tecnología y excelencia operacional.',
      education: 'Ingeniero de Sistemas e Ingeniero Industrial, Universidad de los Andes',
      languages: 'Español, Inglés',
      years_of_experience: 3,
    }),
  c('c24', 'Ixtli Yolot Barbosa', 'Consultor Senior', 'Associate',
    ['Gestión de Proyectos', 'Transformación Digital', 'Mejora de Procesos', 'ERP', 'Estrategia de TI'],
    '2026-05-29', null, null, {
      bio: 'Ixtli cuenta con experiencia en implementaciones Agile, desarrollo de planes estratégicos de TI y negocio, identificación de nuevas líneas de negocios digitales y optimización Lean de procesos.',
      education: 'Ingeniería de Sistemas, Universidad de Los Andes',
      years_of_experience: 2,
      certifications: ['Scrum Master Certificada'],
    }),
  c('c25', 'Juan David Yara', 'Asociado', 'Associate',
    ['Estrategia Corporativa', 'Análisis de Negocio', 'Comunicación Ejecutiva'],
    null),
  c('c26', 'Violeta Rodríguez', 'Asociada', 'Associate',
    ['Transformación Digital', 'Arquitectura de Sistemas', 'Análisis de Negocio', 'Estrategia de TI'],
    null, null, null, {
      bio: 'Violeta cuenta con más de 3 años de experiencia en proyectos de transformación digital, definición de arquitectura, procesos de selección de soluciones tecnológicas y análisis de brechas.',
      languages: 'Español, Inglés',
      years_of_experience: 3,
    }),
  // Senior Consultants
  c('c27', 'Maria Camila González', 'Consultor Senior', 'Senior Consultant',
    ['Estrategia Corporativa', 'Sector Financiero', 'Telecomunicaciones', 'Análisis de Negocio'],
    null, null, null, {
      bio: 'María Camila cuenta con 5+ años de experiencia en industria y en consultoría estratégica en los sectores financiero, oil & gas y telecomunicaciones.',
      languages: 'Español, Inglés, Francés',
    }),
  c('c28', 'Maria Camila Coronado', 'Consultor Senior', 'Senior Consultant',
    ['Modelo Operativo', 'Mejora de Procesos', 'Excelencia Operativa'],
    '2026-08-21', null, null, {
      bio: 'María Camila cuenta con más de 5 años de experiencia en la transformación de modelos operativos y mejora de procesos en los sectores real y financiero, aplicando metodologías ágiles, Lean Six Sigma y Design Thinking.',
      years_of_experience: 5,
    }),
  c('c29', 'Maria Carolina De Lima', 'Consultor Senior - HRBP', 'Senior Consultant',
    ['Gestión del Cambio', 'Diseño Organizacional', 'Comunicación Ejecutiva', 'Liderazgo de Equipos'],
    '2026-07-31', null, null, {
      bio: 'María Carolina cuenta con más de 4 años de experiencia en equipos y procesos de talento humano, ejecutando proyectos de gestión del cambio, clima y cultura organizacional y desarrollo de personas.',
      education: 'Administradora de Empresas, Pontificia Universidad Javeriana',
      languages: 'Español, Inglés',
      years_of_experience: 4,
    }),
  c('c30', 'Nathalia Vélez', 'Consultor Senior', 'Senior Consultant',
    ['Estrategia de TI', 'Excelencia Operativa', 'Transformación Digital', 'Gestión del Cambio', 'Estrategia Corporativa'],
    '2026-11-30', null, null, {
      bio: 'Nathalia tiene más de 3 años de experiencia en planeación de estrategias de tecnología, excelencia operacional, programas de transformación operativa y evolución de la fuerza de trabajo.',
      education: 'Administradora de Empresas con énfasis en Innovación con Tecnología, Universidad de los Andes',
      languages: 'Español',
      years_of_experience: 3,
    }),
  c('c31', 'Juan David Alarcón', 'Consultor Senior', 'Senior Consultant',
    ['Arquitectura de Sistemas', 'Modelamiento Financiero', 'AWS', 'Transformación Digital'],
    null, null, null, {
      bio: 'Juan David cuenta con experiencia en diseño e implementación de páginas web y desarrollo de modelos financieros para cumplir regulaciones del sector.',
      education: 'Ingeniero Biomédico e Ingeniero Mecánico, Universidad de los Andes',
      languages: 'Español, Inglés',
      certifications: ['Certificado Azure', 'Certificado AWS'],
    }),
  c('c32', 'María Crissien', 'Consultor Senior', 'Senior Consultant',
    ['Estrategia Corporativa', 'Transformación Digital', 'Due Diligence de TI', 'SAP', 'ERP'],
    '2026-11-30', null, null, {
      bio: 'Maria Alejandra cuenta con experiencia en planeación estratégica, transformación digital, due diligence y gestión e implementación de proyectos de tecnología (SAP S4/HANA Cloud) en sectores O&G, Insurtech, Fintech y holdings.',
      languages: 'Español, Inglés',
      years_of_experience: 1,
    }),
  c('c33', 'Fabian Becerra', 'Consultor Senior de Tecnología', 'Senior Consultant',
    ['Análisis de Datos', 'Análisis de Negocio', 'Sector Financiero', 'Business Intelligence', 'Machine Learning', 'Arquitectura de Datos', 'RPA'],
    '2026-05-29', null, null, {
      bio: 'Fabian es Technology Consultant con experiencia en proyectos de analítica, riesgo y transformación tecnológica en el sector financiero, participando en iniciativas para entidades bancarias en América Latina y el Caribe.',
      years_of_experience: 3,
    }),
  c('c34', 'Nicolas Velez', 'Consultor Senior', 'Senior Consultant',
    ['Gestión de Proyectos', 'Estrategia de TI', 'Modelamiento Financiero', 'PMO', 'Transformación Digital'],
    '2026-08-21', null, null, {
      bio: 'Nicolás tiene 4+ años de experiencia en consultoría y la industria financiera. Ha liderado proyectos cross-country para grandes corporaciones en España, Colombia y EEUU.',
      education: 'Ingeniero Industrial, Universidad de Los Andes · Minor en Matemáticas, Universidad de Los Andes',
      languages: 'Español, Inglés',
      years_of_experience: 4,
    }),
  c('c35', 'Mateo Pimentel', 'Consultor Senior', 'Senior Consultant',
    ['Mejora de Procesos', 'Modelo Operativo'],
    '2026-08-21'),
  c('c36', 'Diego Campos', 'Consultor Senior', 'Senior Consultant',
    ['Modelo Operativo', 'Arquitectura de Sistemas', 'Estrategia de TI', 'Mejora de Procesos', 'Post-fusión e Integración'],
    '2026-11-30', null, null, {
      bio: 'Diego cuenta con experiencia en planeación y ejecución de proyectos de diseño de modelos operativos post-integración en los sectores financiero y O&G, así como en selección de software para el sector asegurador.',
      education: 'Administrador de Empresas y Especialista en Inteligencia de Mercados con opción en Derecho de los Negocios, Universidad de los Andes',
      languages: 'Español, Inglés',
      certifications: ['Lean Six Sigma Yellow Belt'],
    }),
  c('c37', 'Juan Felipe Patiño', 'Consultor', 'Senior Consultant',
    ['Estrategia Corporativa', 'Arquitectura de Sistemas', 'Estrategia de TI', 'Gestión de Proyectos', 'Gestión de Stakeholders'],
    '2026-11-30', null, null, {
      bio: 'Juan Felipe cuenta con experiencia en desarrollo de productos, estrategia de producto, desarrollo de software y relacionamiento con proveedores.',
      education: 'Ingeniero Industrial e Ingeniero de Sistemas y Computación con opción en Derecho de los Negocios, Universidad de los Andes',
      languages: 'Español, Inglés',
      years_of_experience: 1,
    }),
  c('c38', 'David Rincón', 'Consultor Senior', 'Senior Consultant',
    ['Transformación Digital', 'Estrategia de TI', 'AWS'],
    '2026-11-30'),
  c('c39', 'Daniel Ángel', 'Consultor Senior', 'Senior Consultant',
    ['Gestión del Cambio', 'Comunicación Ejecutiva', 'Facilitación'],
    '2026-12-31'),
  c('c40', 'Gabriela García', 'Consultor Senior', 'Senior Consultant',
    ['Análisis de Negocio', 'Mejora de Procesos'],
    '2026-11-30'),
  c('c41', 'Laura Forero', 'Consultor Senior', 'Senior Consultant',
    ['Análisis de Datos', 'Power BI', 'SQL'],
    '2026-11-30'),
  // Consultants
  c('c42', 'Lina María Gómez', 'Consultor', 'Consultant',
    ['Análisis de Negocio', 'Análisis de Datos', 'Comunicación Ejecutiva'],
    null),
  c('c43', 'Juan Felipe Sánchez', 'Consultor', 'Consultant',
    ['Análisis de Negocio', 'Análisis de Datos'],
    '2026-08-21'),
  c('c44', 'Nathalia Quiroga', 'Consultor', 'Consultant',
    ['Análisis de Datos', 'SQL', 'Python'],
    null),
  c('c45', 'Sebastian Gomez', 'Consultor', 'Consultant',
    ['Mejora de Procesos', 'Modelo Operativo', 'Análisis de Datos'],
    '2026-12-31'),
  c('c46', 'Andrés Villota', 'Consultor', 'Consultant',
    ['Modelamiento Financiero', 'Análisis de Negocio', 'Comunicación Ejecutiva'],
    '2026-11-30'),
  c('c47', 'Juan Currea', 'Consultor', 'Consultant',
    ['Transformación Digital', 'Estrategia de TI', 'Análisis de Negocio'],
    null),
  c('c48', 'Julián Cardenas', 'Consultor', 'Consultant',
    ['Gestión del Cambio', 'Comunicación Ejecutiva', 'Facilitación'],
    null),
  c('c49', 'Emilio Baquerizo', 'Consultor', 'Consultant',
    ['Estrategia Corporativa', 'Análisis de Negocio', 'Análisis de Datos'],
    null),
  c('c50', 'Santiago Arevalo', 'Consultor', 'Consultant',
    ['Análisis de Datos', 'Power BI', 'SQL'],
    '2026-11-30'),
  c('c51', 'Matias Bermudez', 'Consultor', 'Consultant',
    ['Análisis de Negocio', 'Mejora de Procesos'],
    '2026-05-29'),
  c('c52', 'Juana Mejia', 'Consultor', 'Consultant',
    ['Diseño Organizacional', 'Análisis de Negocio'],
    null),
  c('c53', 'Sophie Tobias', 'Consultor', 'Consultant',
    ['Gestión de Proyectos', 'Comunicación Ejecutiva'],
    '2026-12-31'),
  c('c54', 'Manuela Lizcano', 'Consultor', 'Consultant',
    ['Modelamiento Financiero', 'Análisis de Negocio', 'Análisis de Datos'],
    '2026-11-30'),
  c('c55', 'Giuliana Volpi', 'Consultor', 'Consultant',
    ['Análisis de Datos', 'Machine Learning', 'Python', 'Arquitectura de Datos'],
    '2026-05-29', null, null, {
      bio: 'Giuliana cuenta con experiencia como Data Analyst y ejecución de proyectos de analítica avanzada, machine learning y arquitectura de soluciones.',
      languages: 'Español, Inglés, Italiano',
    }),
  c('c56', 'Juan Felipe Puig', 'Consultor', 'Consultant',
    ['Transformación Digital', 'Estrategia de TI', 'Gestión de Proyectos'],
    '2026-11-30'),
  // Interns
  c('c57', 'Juan Manuel Perez', 'Practicante', 'Intern',
    ['Análisis de Negocio', 'Análisis de Datos', 'Comunicación Ejecutiva'],
    '2026-11-30', null, '2026-07-31'),
  c('c58', 'Maria Fernanda Amador', 'Practicante', 'Intern',
    ['Análisis de Negocio', 'Análisis de Datos'],
    '2026-06-12', null, '2026-07-31'),
  c('c59', 'Amalia Carbonell', 'Practicante', 'Intern',
    ['Análisis de Negocio', 'Comunicación Ejecutiva'],
    null, null, '2026-07-31'),
  c('c60', 'Santiago Celis', 'Practicante de Consultoría en TI', 'Intern',
    ['Machine Learning', 'Arquitectura de Sistemas', 'Análisis de Datos'],
    null, null, '2026-07-31', {
      bio: 'Santiago cuenta con experiencia en desarrollo y soporte de plataformas tecnológicas, con foco en mejora de la experiencia del usuario, soluciones basadas en IA generativa y análisis de datos.',
      education: 'Ingeniería de Sistemas y Computación, Universidad de los Andes',
      languages: 'Español, Inglés',
    }),
  c('c61', 'Sofia Correa', 'Practicante', 'Intern',
    ['Análisis de Negocio', 'Análisis de Datos', 'Comunicación Ejecutiva'],
    null, null, '2026-07-31'),
  // ── Consultants from 2026 Kimble — profiles pending completion ──────────────
  c('c62', 'Andres Felipe Sopo',      'Consultor', 'Consultant', [], null),
  c('c63', 'Catalina Bernal',         'Consultor', 'Consultant', [], null),
  c('c64', 'Daniel Cortes',           'Consultor', 'Consultant', [], null),
  c('c65', 'Ernesto Duarte',          'Consultor', 'Consultant', [], null),
  c('c66', 'Hernan Sanchez',          'Consultor', 'Consultant', [], null),
  c('c67', 'Juan Andres Martinez',    'Consultor', 'Consultant', [], null),
  c('c68', 'Juan Carlos Cárdenas',    'Consultor', 'Consultant', [], null),
  c('c69', 'Juan Felipe Quintero',    'Consultor', 'Consultant', [], null),
  c('c70', 'Juan Pablo Linares',      'Consultor', 'Consultant', [], null),
  c('c71', 'María Constanza Cabrera', 'Consultor', 'Consultant', [], null),
  c('c72', 'Santiago Luengas',        'Consultor', 'Consultant', [], null),
  c('c73', 'Jaime Aragón',            'Gerente Senior', 'Senior Manager', [], null),
  // ── New hires 2026 ────────────────────────────────────────────────────────
  c('c74', 'Melissa Almeida',         'Consultor', 'Consultant', [], null),
  c('c75', 'Sara Lopez',              'Consultor', 'Consultant', [], null),
  c('c76', 'Mateo Zarama',            'Consultor', 'Consultant', [], null),
  c('c77', 'Alejandro Abdel',         'Consultor', 'Consultant', [], null),
]

/**
 * Overrides for consultants whose real @bip-group.com email does NOT match
 * the derived "firstname.lastname" pattern.  Map: real email → consultant id.
 */
export const EMAIL_OVERRIDES: Record<string, string> = {
  'camila.coronado@bip-group.com':  'c28',   // Maria Camila Coronado  (derived: maria.coronado)
  'maria.delima@bip-group.com':     'c29',   // Maria Carolina De Lima (derived: maria.lima)
  'felipe.patino@bip-group.com':    'c37',   // Juan Felipe Patiño     (derived: juan.patino)
  'manuel.perez@bip-group.com':     'c57',   // Juan Manuel Perez      (derived: juan.perez)
  // HR admins
  'carla.villaverde@bip-group.com': 'hr_carla',
  'martha.martinez@bip-group.com':  'hr_martha',
}

// Projects — sourced from SAP-Kimble export
export const mockProjects: Project[] = [
  {
    id: 'p711',
    name: 'Consolidación Aval Asset Management',
    client: 'Aval Fiduciaria',
    industry: 'Financial Services',
    description: 'Asset management consolidation and operating model design.',
    status: 'Active',
    start_date: '2026-02-09',
    end_date: '2026-11-30',
    team_size: 21,
    skills_required: ['Modelamiento Financiero', 'Excelencia Operativa', 'Gestión del Cambio', 'Gestión de Proyectos'],
    kimble_code: 'e000711',
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'p713',
    name: 'Proyecto Cóndor',
    client: 'Banco de Bogotá',
    industry: 'Financial Services',
    description: 'Comprehensive strategic and operational transformation program.',
    status: 'Active',
    start_date: '2026-02-12',
    end_date: '2026-12-31',
    team_size: 12,
    skills_required: ['Estrategia Corporativa', 'Gestión del Cambio', 'Gestión de Proyectos', 'Análisis de Negocio', 'Gestión de Stakeholders'],
    kimble_code: 'e000713',
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'p600',
    name: 'Selección y Gap Analysis ERP LATAM',
    client: 'Holcim',
    industry: 'Manufacturing',
    description: 'ERP vendor selection and gap analysis across LATAM operations.',
    status: 'Active',
    start_date: '2026-01-05',
    end_date: '2026-08-21',
    team_size: 8,
    skills_required: ['ERP', 'SAP', 'Análisis de Negocio', 'Gestión de Proyectos', 'Análisis de Datos'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p608',
    name: 'Implementación Core',
    client: 'Pacífico Seguros',
    industry: 'Insurance',
    description: 'Core insurance platform implementation.',
    status: 'Active',
    start_date: '2026-01-05',
    end_date: '2026-05-29',
    team_size: 7,
    skills_required: ['PMO', 'Análisis de Negocio', 'Estrategia de TI', 'Gestión de Proyectos'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p712',
    name: 'GAP Análisis',
    client: 'D1',
    industry: 'Retail',
    description: 'ERP gap analysis for retail operations.',
    status: 'Active',
    start_date: '2026-02-09',
    end_date: '2026-04-17',
    team_size: 4,
    skills_required: ['ERP', 'Análisis de Negocio', 'Mejora de Procesos'],
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'p704',
    name: 'Interim Security Role Fase 2',
    client: 'Aruba Bank',
    industry: 'Financial Services',
    description: 'Cybersecurity interim management and controls implementation.',
    status: 'Active',
    start_date: '2026-01-05',
    end_date: '2026-04-03',
    team_size: 4,
    skills_required: ['Ciberseguridad', 'Estrategia de TI', 'Análisis de Negocio'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p702',
    name: 'Estrategia de Negocio',
    client: 'PersonalSoft',
    industry: 'Technology',
    description: 'Business strategy definition and go-to-market planning.',
    status: 'Active',
    start_date: '2026-02-09',
    end_date: '2026-04-03',
    team_size: 4,
    skills_required: ['Estrategia Corporativa', 'Análisis de Negocio', 'Modelamiento Financiero'],
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'p691',
    name: 'Consolidación y Evolución ERP/DMS',
    client: 'Autogermana',
    industry: 'Automotive',
    description: 'ERP and DMS consolidation project.',
    status: 'Active',
    start_date: '2026-02-17',
    end_date: '2026-03-17',
    team_size: 3,
    skills_required: ['ERP', 'Análisis de Negocio', 'Gestión del Cambio'],
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'p690',
    name: 'Delfos',
    client: 'Grupo AVAL',
    industry: 'Financial Services',
    description: 'Strategic analytics and forecasting platform.',
    status: 'Active',
    start_date: '2026-01-02',
    end_date: '2026-03-18',
    team_size: 3,
    skills_required: ['Análisis de Datos', 'Estrategia Corporativa', 'Business Intelligence'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p688',
    name: 'Implementación Estrategia CIAM',
    client: 'Compensar',
    industry: 'Healthcare',
    description: 'Customer Identity and Access Management strategy implementation.',
    status: 'Active',
    start_date: '2026-01-13',
    end_date: '2026-01-30',
    team_size: 3,
    skills_required: ['Ciberseguridad', 'Estrategia de TI', 'PMO'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p681',
    name: 'Revisión del Modelo Comercial',
    client: 'Pacífico Seguros',
    industry: 'Insurance',
    description: 'Commercial operating model review and redesign.',
    status: 'Active',
    start_date: '2026-01-12',
    end_date: '2026-02-20',
    team_size: 2,
    skills_required: ['Estrategia Corporativa', 'Diseño Organizacional', 'Análisis de Negocio'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p668',
    name: 'Kronos Acompañamiento Implementación',
    client: 'Corficolombiana',
    industry: 'Financial Services',
    description: 'Workforce management system implementation support.',
    status: 'Active',
    start_date: '2026-01-05',
    end_date: '2026-02-20',
    team_size: 8,
    skills_required: ['Gestión del Cambio', 'Gestión de Proyectos', 'Mejora de Procesos'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p604',
    name: 'Estrategia de Integración',
    client: 'Kairos',
    industry: 'Technology',
    description: 'Integration strategy for technology platforms.',
    status: 'Active',
    start_date: '2026-01-02',
    end_date: '2026-02-06',
    team_size: 18,
    skills_required: ['Estrategia de TI', 'Arquitectura de Sistemas', 'Gestión de Proyectos'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p594',
    name: 'Gap Analysis Implementación ERP',
    client: 'OLCSAL',
    industry: 'Manufacturing',
    description: 'ERP implementation gap analysis for manufacturing operations.',
    status: 'Active',
    start_date: '2026-01-05',
    end_date: '2026-01-30',
    team_size: 2,
    skills_required: ['ERP', 'Análisis de Negocio', 'Mejora de Procesos'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p720',
    name: 'Laboratorio digital',
    client: 'ACH',
    industry: 'Financial Services',
    description: '',
    status: 'Active',
    start_date: '2026-04-06',
    end_date: '2026-07-17',
    team_size: 5,
    skills_required: [],
    kimble_code: 'e000720',
    service_area: 'Strategy & Innovation',
    created_at: '2026-04-06T00:00:00Z',
  },
  {
    id: 'p719',
    name: 'Motor de Ejecución Estratégica',
    client: 'Aportes en Línea',
    industry: 'Financial Services',
    description: '',
    status: 'Active',
    start_date: '2026-04-07',
    end_date: '2026-05-29',
    team_size: 5,
    skills_required: [],
    kimble_code: 'e000719',
    service_area: 'Technology Advisory',
    created_at: '2026-04-07T00:00:00Z',
  },
  {
    id: 'p699',
    name: 'Marketing digital',
    client: 'Politecnico Internacional',
    industry: 'Other',
    description: '',
    status: 'Active',
    start_date: '2026-02-02',
    end_date: '2026-06-19',
    team_size: 1,
    skills_required: [],
    kimble_code: 'e000699',
    service_area: 'X-Tech',
    created_at: '2026-02-02T00:00:00Z',
  },
  {
    id: 'p724',
    name: 'Interim Security Role Fase 3',
    client: 'Aruba Bank',
    industry: 'Financial Services',
    description: '',
    status: 'Open',
    start_date: '2026-05-04',
    end_date: '2026-05-29',
    team_size: 1,
    skills_required: [],
    positions: [{ id: 'p724-pos-0', role: 'Consultor', seniority: 'Consultant', skills: [] }],
    kimble_code: 'e000724',
    service_area: 'Cyber Security',
    created_at: '2026-05-04T00:00:00Z',
  },
]

// Real assignments from SAP-Kimble — only active (end_date >= 2026-04-20)
export const mockAssignments: ProjectAssignment[] = [
  // ── Aval Fiduciaria — Consolidación Aval Asset Management ──
  { id: 'a01', project_id: 'p711', consultant_id: 'c1',  dedication_percentage: 30,  end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a02', project_id: 'p711', consultant_id: 'c4',  dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a03', project_id: 'p711', consultant_id: 'c7',  dedication_percentage: 40,  end_date: '2026-07-31', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a04', project_id: 'p711', consultant_id: 'c6',  dedication_percentage: 50,  end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a05', project_id: 'p711', consultant_id: 'c12', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a06', project_id: 'p711', consultant_id: 'c17', dedication_percentage: 50,  end_date: '2026-11-30', assigned_at: '2026-02-23T00:00:00Z' },
  { id: 'a07', project_id: 'p711', consultant_id: 'c19', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a08', project_id: 'p711', consultant_id: 'c23', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a09', project_id: 'p711', consultant_id: 'c30', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-16T00:00:00Z' },
  { id: 'a10', project_id: 'p711', consultant_id: 'c29', dedication_percentage: 100, end_date: '2026-07-31', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a11', project_id: 'p711', consultant_id: 'c32', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a12', project_id: 'p711', consultant_id: 'c46', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a13', project_id: 'p711', consultant_id: 'c40', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a14', project_id: 'p711', consultant_id: 'c36', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a15', project_id: 'p711', consultant_id: 'c56', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-12T00:00:00Z' },
  { id: 'a16', project_id: 'p711', consultant_id: 'c41', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a17', project_id: 'p711', consultant_id: 'c37', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a18', project_id: 'p711', consultant_id: 'c54', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a19', project_id: 'p711', consultant_id: 'c50', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-03-02T00:00:00Z' },
  { id: 'a20', project_id: 'p711', consultant_id: 'c38', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-23T00:00:00Z' },
  { id: 'a21', project_id: 'p711', consultant_id: 'c57', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  // ── Banco de Bogotá — Proyecto Cóndor ──
  { id: 'a22', project_id: 'p713', consultant_id: 'c1',  dedication_percentage: 20,  end_date: '2026-12-31', assigned_at: '2026-02-12T00:00:00Z' },
  { id: 'a23', project_id: 'p713', consultant_id: 'c2',  dedication_percentage: 50,  end_date: '2026-12-31', assigned_at: '2026-02-12T00:00:00Z' },
  { id: 'a24', project_id: 'p713', consultant_id: 'c6',  dedication_percentage: 50,  end_date: '2026-12-31', assigned_at: '2026-02-12T00:00:00Z' },
  { id: 'a25', project_id: 'p713', consultant_id: 'c8',  dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-12T00:00:00Z' },
  { id: 'a26', project_id: 'p713', consultant_id: 'c14', dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-16T00:00:00Z' },
  { id: 'a27', project_id: 'p713', consultant_id: 'c16', dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-25T00:00:00Z' },
  { id: 'a28', project_id: 'p713', consultant_id: 'c22', dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-12T00:00:00Z' },
  { id: 'a29', project_id: 'p713', consultant_id: 'c53', dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-25T00:00:00Z' },
  { id: 'a30', project_id: 'p713', consultant_id: 'c45', dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-16T00:00:00Z' },
  { id: 'a31', project_id: 'p713', consultant_id: 'c39', dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-16T00:00:00Z' },
  { id: 'a32', project_id: 'p713', consultant_id: 'c55', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-02-16T00:00:00Z' },
  { id: 'a33', project_id: 'p713', consultant_id: 'c58', dedication_percentage: 100, end_date: '2026-06-12', assigned_at: '2026-02-16T00:00:00Z' },
  // ── Holcim — ERP LATAM ──
  { id: 'a34', project_id: 'p600', consultant_id: 'c3',  dedication_percentage: 15,  end_date: '2026-08-21', assigned_at: '2026-01-13T00:00:00Z' },
  { id: 'a35', project_id: 'p600', consultant_id: 'c9',  dedication_percentage: 50,  end_date: '2026-08-21', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a36', project_id: 'p600', consultant_id: 'c10', dedication_percentage: 100, end_date: '2026-08-21', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a37', project_id: 'p600', consultant_id: 'c15', dedication_percentage: 100, end_date: '2026-08-21', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a38', project_id: 'p600', consultant_id: 'c28', dedication_percentage: 100, end_date: '2026-08-21', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a39', project_id: 'p600', consultant_id: 'c34', dedication_percentage: 100, end_date: '2026-08-21', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a40', project_id: 'p600', consultant_id: 'c35', dedication_percentage: 100, end_date: '2026-08-21', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a41', project_id: 'p600', consultant_id: 'c43', dedication_percentage: 100, end_date: '2026-08-21', assigned_at: '2026-01-13T00:00:00Z' },
  // ── Pacífico Seguros — Implementación Core ──
  { id: 'a42', project_id: 'p608', consultant_id: 'c3',  dedication_percentage: 20,  end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a43', project_id: 'p608', consultant_id: 'c5',  dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a44', project_id: 'p608', consultant_id: 'c17', dedication_percentage: 50,  end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a45', project_id: 'p608', consultant_id: 'c21', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a46', project_id: 'p608', consultant_id: 'c24', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a47', project_id: 'p608', consultant_id: 'c33', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' },
  { id: 'a48', project_id: 'p608', consultant_id: 'c51', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' },
  // ── Aval Fiduciaria — new consultants (c62, c65, c67) ──
  { id: 'a49', project_id: 'p711', consultant_id: 'c62', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a50', project_id: 'p711', consultant_id: 'c65', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  { id: 'a51', project_id: 'p711', consultant_id: 'c67', dedication_percentage: 100, end_date: '2026-11-30', assigned_at: '2026-02-09T00:00:00Z' },
  // ── ACH — Laboratorio digital ──
  { id: 'a52', project_id: 'p720', consultant_id: 'c2',  dedication_percentage: 20,  end_date: '2026-07-17', assigned_at: '2026-04-06T00:00:00Z' },
  { id: 'a53', project_id: 'p720', consultant_id: 'c13', dedication_percentage: 100, end_date: '2026-07-17', assigned_at: '2026-04-06T00:00:00Z' },
  { id: 'a54', project_id: 'p720', consultant_id: 'c52', dedication_percentage: 100, end_date: '2026-07-17', assigned_at: '2026-04-06T00:00:00Z' },
  { id: 'a55', project_id: 'p720', consultant_id: 'c59', dedication_percentage: 100, end_date: '2026-07-17', assigned_at: '2026-04-06T00:00:00Z' },
  { id: 'a56', project_id: 'p720', consultant_id: 'c68', dedication_percentage: 100, end_date: '2026-07-17', assigned_at: '2026-04-06T00:00:00Z' },
  // ── Aportes en Línea — Motor de Ejecución Estratégica ──
  { id: 'a57', project_id: 'p719', consultant_id: 'c1',  dedication_percentage: 20,  end_date: '2026-05-29', assigned_at: '2026-04-07T00:00:00Z' },
  { id: 'a58', project_id: 'p719', consultant_id: 'c4',  dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-04-07T00:00:00Z' },
  { id: 'a59', project_id: 'p719', consultant_id: 'c18', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-04-07T00:00:00Z' },
  { id: 'a60', project_id: 'p719', consultant_id: 'c27', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-04-07T00:00:00Z' },
  { id: 'a61', project_id: 'p719', consultant_id: 'c49', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-04-07T00:00:00Z' },
  // ── Politecnico Internacional — Marketing digital ──
  { id: 'a62', project_id: 'p699', consultant_id: 'c63', dedication_percentage: 100, end_date: '2026-06-19', assigned_at: '2026-02-02T00:00:00Z' },

  // ── D1 — GAP Analisis (ended Apr 17, from Kimble E000712) ──
  { id: 'a63', project_id: 'p703', consultant_id: 'c3',  dedication_percentage: 100, end_date: '2026-04-17', assigned_at: '2026-02-09T00:00:00Z' }, // Juan Fernando Forero
  { id: 'a64', project_id: 'p703', consultant_id: 'c9',  dedication_percentage: 100, end_date: '2026-04-17', assigned_at: '2026-02-09T00:00:00Z' }, // Iván Melo
  { id: 'a65', project_id: 'p703', consultant_id: 'c26', dedication_percentage: 100, end_date: '2026-04-17', assigned_at: '2026-02-09T00:00:00Z' }, // Violeta Rodríguez
  { id: 'a66', project_id: 'p703', consultant_id: 'c61', dedication_percentage: 100, end_date: '2026-04-17', assigned_at: '2026-02-09T00:00:00Z' }, // Sofia Correa

  // ── Aruba Bank — Interim Security Role Fase 2 (ended Apr 3, from Kimble E000704) ──
  { id: 'a67', project_id: 'p704', consultant_id: 'c2',  dedication_percentage: 20,  end_date: '2026-04-03', assigned_at: '2026-01-05T00:00:00Z' }, // John Jairo Romero
  { id: 'a68', project_id: 'p704', consultant_id: 'c11', dedication_percentage: 100, end_date: '2026-04-03', assigned_at: '2026-01-05T00:00:00Z' }, // Alejandro Manrique
  { id: 'a69', project_id: 'p704', consultant_id: 'c44', dedication_percentage: 100, end_date: '2026-04-03', assigned_at: '2026-01-05T00:00:00Z' }, // Nathalia Quiroga
  { id: 'a70', project_id: 'p704', consultant_id: 'c48', dedication_percentage: 100, end_date: '2026-04-03', assigned_at: '2026-01-05T00:00:00Z' }, // Julián Cardenas

  // ── PersonalSoft — Estrategia de Negocio (ended Apr 10, from Kimble) ──
  { id: 'a71', project_id: 'p702', consultant_id: 'c3',  dedication_percentage: 100, end_date: '2026-04-10', assigned_at: '2025-12-01T00:00:00Z' }, // Juan Fernando Forero
  { id: 'a72', project_id: 'p702', consultant_id: 'c13', dedication_percentage: 100, end_date: '2026-04-10', assigned_at: '2025-12-01T00:00:00Z' }, // Felipe Mediorreal
  { id: 'a73', project_id: 'p702', consultant_id: 'c27', dedication_percentage: 100, end_date: '2026-03-27', assigned_at: '2025-12-01T00:00:00Z' }, // Maria Camila González
  { id: 'a74', project_id: 'p702', consultant_id: 'c49', dedication_percentage: 100, end_date: '2026-04-10', assigned_at: '2025-12-01T00:00:00Z' }, // Emilio Baquerizo

  // ── Autogermana — Consolidación ERP/DMS (ended Mar 17, from Kimble E000691) ──
  { id: 'a75', project_id: 'p691', consultant_id: 'c2',  dedication_percentage: 20,  end_date: '2026-03-17', assigned_at: '2026-02-17T00:00:00Z' }, // John Jairo Romero
  { id: 'a76', project_id: 'p691', consultant_id: 'c18', dedication_percentage: 100, end_date: '2026-03-17', assigned_at: '2026-02-17T00:00:00Z' }, // Diego Castro
  { id: 'a77', project_id: 'p691', consultant_id: 'c52', dedication_percentage: 100, end_date: '2026-03-17', assigned_at: '2026-02-17T00:00:00Z' }, // Juana Mejia
  { id: 'a77b', project_id: 'p691', consultant_id: 'c59', dedication_percentage: 100, end_date: '2026-03-17', assigned_at: '2026-02-17T00:00:00Z' }, // Amalia Carbonell

  // ── Grupo AVAL — Delfos (ended Mar 18, from Kimble E000690) ──
  { id: 'a78', project_id: 'p690', consultant_id: 'c25', dedication_percentage: 100, end_date: '2026-03-18', assigned_at: '2026-01-02T00:00:00Z' }, // Juan David Yara
  { id: 'a79', project_id: 'p690', consultant_id: 'c31', dedication_percentage: 100, end_date: '2026-03-18', assigned_at: '2026-01-02T00:00:00Z' }, // Juan David Alarcón
  { id: 'a80', project_id: 'p690', consultant_id: 'c42', dedication_percentage: 100, end_date: '2026-03-18', assigned_at: '2026-01-02T00:00:00Z' }, // Lina María Gómez
  { id: 'a80b', project_id: 'p690', consultant_id: 'c60', dedication_percentage: 100, end_date: '2026-03-18', assigned_at: '2026-01-02T00:00:00Z' }, // Santiago Celis

  // ── Compensar — Implementación Estrategia CIAM (ended Jan 30, from Kimble E000688) ──
  { id: 'a81', project_id: 'p688', consultant_id: 'c2',  dedication_percentage: 20,  end_date: '2026-01-30', assigned_at: '2026-01-13T00:00:00Z' }, // John Jairo Romero
  { id: 'a82', project_id: 'p688', consultant_id: 'c8',  dedication_percentage: 100, end_date: '2026-01-30', assigned_at: '2026-01-13T00:00:00Z' }, // Felipe Estrada
  { id: 'a83', project_id: 'p688', consultant_id: 'c39', dedication_percentage: 100, end_date: '2026-01-30', assigned_at: '2026-01-13T00:00:00Z' }, // Daniel Ángel

  // ── Pacífico Seguros — Revisión del Modelo Comercial (ended Feb 20, from Kimble E000681) ──
  { id: 'a84', project_id: 'p681', consultant_id: 'c3',  dedication_percentage: 100, end_date: '2026-02-20', assigned_at: '2026-01-12T00:00:00Z' }, // Juan Fernando Forero

  // ── Corficolombiana — Kronos Acompañamiento (ended Feb 20, from Kimble E000668) ──
  { id: 'a86', project_id: 'p668', consultant_id: 'c2',  dedication_percentage: 20,  end_date: '2026-02-20', assigned_at: '2026-01-05T00:00:00Z' }, // John Jairo Romero
  { id: 'a87', project_id: 'p668', consultant_id: 'c7',  dedication_percentage: 20,  end_date: '2026-02-20', assigned_at: '2026-01-05T00:00:00Z' }, // Carla Villaverde
  { id: 'a88', project_id: 'p668', consultant_id: 'c16', dedication_percentage: 100, end_date: '2026-02-20', assigned_at: '2026-01-05T00:00:00Z' }, // Andrea Rosales
  { id: 'a89', project_id: 'p668', consultant_id: 'c17', dedication_percentage: 100, end_date: '2026-02-20', assigned_at: '2026-01-05T00:00:00Z' }, // Guillermo Ferro
  { id: 'a90', project_id: 'p668', consultant_id: 'c30', dedication_percentage: 100, end_date: '2026-02-20', assigned_at: '2026-01-05T00:00:00Z' }, // Nathalia Vélez
  { id: 'a91', project_id: 'p668', consultant_id: 'c38', dedication_percentage: 100, end_date: '2026-02-20', assigned_at: '2026-01-05T00:00:00Z' }, // David Rincón
  { id: 'a92', project_id: 'p668', consultant_id: 'c50', dedication_percentage: 100, end_date: '2026-02-20', assigned_at: '2026-01-05T00:00:00Z' }, // Santiago Arevalo
  { id: 'a93', project_id: 'p668', consultant_id: 'c53', dedication_percentage: 100, end_date: '2026-02-20', assigned_at: '2026-01-05T00:00:00Z' }, // Sophie Tobias

  // ── Kairos — Estrategia de Integración (ended Feb 6) ──
  { id: 'a94', project_id: 'p604', consultant_id: 'c11', dedication_percentage: 100, end_date: '2026-02-06', assigned_at: '2026-01-02T00:00:00Z' },
  { id: 'a95', project_id: 'p604', consultant_id: 'c25', dedication_percentage: 100, end_date: '2026-02-06', assigned_at: '2026-01-02T00:00:00Z' },
  { id: 'a96', project_id: 'p604', consultant_id: 'c31', dedication_percentage: 100, end_date: '2026-02-06', assigned_at: '2026-01-02T00:00:00Z' },
  { id: 'a97', project_id: 'p604', consultant_id: 'c44', dedication_percentage: 100, end_date: '2026-02-06', assigned_at: '2026-01-02T00:00:00Z' },
  { id: 'a98', project_id: 'p604', consultant_id: 'c61', dedication_percentage: 100, end_date: '2026-02-06', assigned_at: '2026-01-02T00:00:00Z' },

  // ── OLCSAL — Gap Analysis ERP (ended Jan 30, from Kimble E000594) ──
  { id: 'a99',  project_id: 'p594', consultant_id: 'c26', dedication_percentage: 100, end_date: '2026-01-30', assigned_at: '2026-01-05T00:00:00Z' }, // Violeta Rodríguez
  { id: 'a100', project_id: 'p594', consultant_id: 'c52', dedication_percentage: 100, end_date: '2026-01-30', assigned_at: '2026-01-05T00:00:00Z' }, // Juana Mejia

  // ── Active project additions (Kimble corrections) ──
  // Banco de Bogotá — Proyecto Cóndor (p713)
  { id: 'a101', project_id: 'p713', consultant_id: 'c3',  dedication_percentage: 20,  end_date: '2026-12-31', assigned_at: '2026-02-12T00:00:00Z' }, // Juan Fernando Forero
  { id: 'a102', project_id: 'p713', consultant_id: 'c51', dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-12T00:00:00Z' }, // Matias Bermudez
  { id: 'a103', project_id: 'p713', consultant_id: 'c66', dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-12T00:00:00Z' }, // Hernan Sanchez
  { id: 'a104', project_id: 'p713', consultant_id: 'c69', dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-12T00:00:00Z' }, // Juan Felipe Quintero
  { id: 'a105', project_id: 'p713', consultant_id: 'c72', dedication_percentage: 100, end_date: '2026-12-31', assigned_at: '2026-02-12T00:00:00Z' }, // Santiago Luengas
  // Holcim — ERP LATAM (p600)
  { id: 'a106', project_id: 'p600', consultant_id: 'c2',  dedication_percentage: 10,  end_date: '2026-08-21', assigned_at: '2026-01-05T00:00:00Z' }, // John Jairo Romero
  { id: 'a107', project_id: 'p600', consultant_id: 'c58', dedication_percentage: 100, end_date: '2026-08-21', assigned_at: '2026-01-05T00:00:00Z' }, // Maria Fernanda Amador
  // Pacífico Seguros — Implementación Core (p608)
  { id: 'a108', project_id: 'p608', consultant_id: 'c59', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' }, // Amalia Carbonell
  { id: 'a109', project_id: 'p608', consultant_id: 'c61', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' }, // Sofia Correa
  { id: 'a110', project_id: 'p608', consultant_id: 'c64', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' }, // Daniel Cortes
  { id: 'a111', project_id: 'p608', consultant_id: 'c70', dedication_percentage: 100, end_date: '2026-05-29', assigned_at: '2026-01-05T00:00:00Z' }, // Juan Pablo Linares
  // Politecnico Internacional — Marketing digital (p699)
  { id: 'a112', project_id: 'p699', consultant_id: 'c47', dedication_percentage: 100, end_date: '2026-06-19', assigned_at: '2026-02-02T00:00:00Z' }, // Juan Currea
]

// ── Historic Kimble enrichment ────────────────────────────────────────────────
// Source: BIP Engagement with Proposal Historic.xlsx
// Industries and service areas derived from all past engagements per consultant.
const HISTORIC_ENRICHMENT: Record<string, { industries: string[]; areas: string[] }> = {
  'Hernando Baquero':      { industries: ['Financial Services', 'Other', 'Transportation'], areas: ['Advisory Digital', 'Business Advisory', 'Cyber Security', 'Strategy & Innovation', 'Technology Advisory'] },
  'John Jairo Romero':     { industries: ['Energy & Utilities', 'Financial Services', 'Other', 'Public Sector & Healthcare', 'Transportation'], areas: ['Advisory Digital', 'Business Advisory', 'Cyber Security', 'Strategy & Innovation', 'Technology Advisory', 'X-Tech'] },
  'Juan Fernando Forero':  { industries: ['Energy & Utilities', 'Financial Services', 'Manufacturing', 'Other', 'Retail', 'Technology, Telco & Media'], areas: ['Advisory Digital', 'Business Advisory', 'Strategy & Innovation', 'Technology Advisory', 'X-Tech'] },
  'Henry Jaimes':          { industries: ['Energy & Utilities', 'Financial Services', 'Other', 'Retail'], areas: ['Business Advisory', 'Strategy & Innovation', 'Technology Advisory', 'X-Tech'] },
  'Andrés Cubillos':       { industries: ['Financial Services'], areas: ['Business Advisory', 'Strategy & Innovation', 'Technology Advisory'] },
  'Jaime Barco':           { industries: ['Financial Services'], areas: ['Business Advisory'] },
  'Carla Villaverde':      { industries: ['Energy & Utilities', 'Financial Services', 'Manufacturing', 'Other', 'Transportation'], areas: ['Advisory Digital', 'Business Advisory', 'Cyber Security', 'Strategy & Innovation', 'Technology Advisory'] },
  'Felipe Estrada':        { industries: ['Financial Services', 'Other'], areas: ['Advisory Digital', 'Cyber Security', 'Strategy & Innovation', 'Technology Advisory'] },
  'Iván Melo':             { industries: ['Financial Services', 'Other', 'Retail'], areas: ['Technology Advisory'] },
  'Magda Patiño':          { industries: ['Financial Services', 'Other', 'Public Sector & Healthcare', 'Retail'], areas: ['Business Advisory', 'Technology Advisory', 'X-Tech'] },
  'Alejandro Manrique':    { industries: ['Energy & Utilities', 'Financial Services', 'Other', 'Pharma & Biotech'], areas: ['Advisory Digital', 'Business Advisory', 'Cyber Security', 'Technology Advisory'] },
  'John Casallas':         { industries: ['Financial Services', 'Transportation'], areas: ['Business Advisory', 'Cyber Security', 'Strategy & Innovation', 'Technology Advisory', 'X-Tech'] },
  'Felipe Mediorreal':     { industries: ['Financial Services'], areas: ['Business Advisory'] },
  'Santiago Serna':        { industries: ['Financial Services', 'Retail'], areas: ['Business Advisory', 'Strategy & Innovation', 'Technology Advisory'] },
  'Angélica Tarazona':     { industries: ['Retail'], areas: ['Technology Advisory'] },
  'Andrea Rosales':        { industries: ['Financial Services'], areas: ['Business Advisory', 'Strategy & Innovation', 'Technology Advisory'] },
  'Guillermo Ferro':       { industries: ['Energy & Utilities', 'Financial Services', 'Other'], areas: ['Advisory Digital', 'Business Advisory', 'Strategy & Innovation', 'Technology Advisory'] },
  'Diego Castro':          { industries: ['Energy & Utilities', 'Financial Services', 'Other', 'Public Sector & Healthcare'], areas: ['Advisory Digital', 'Business Advisory', 'Strategy & Innovation', 'Technology Advisory', 'X-Tech'] },
  'Raúl Aular':            { industries: ['Energy & Utilities', 'Financial Services', 'Manufacturing', 'Other', 'Retail'], areas: ['Business Advisory', 'Strategy & Innovation', 'Technology Advisory'] },
  'Lina Gutiérrez':        { industries: ['Energy & Utilities', 'Financial Services', 'Public Sector & Healthcare'], areas: ['Advisory Digital', 'Business Advisory', 'Strategy & Innovation', 'Technology Advisory'] },
  'Juan David Figueroa':   { industries: ['Financial Services'], areas: ['Technology Advisory'] },
  'Antonio Pérez':         { industries: ['Energy & Utilities', 'Financial Services', 'Other'], areas: ['Business Advisory', 'Technology Advisory'] },
  'Santiago Restrepo':     { industries: ['Financial Services', 'Manufacturing', 'Other', 'Public Sector & Healthcare', 'Transportation'], areas: ['Business Advisory', 'Strategy & Innovation', 'Technology Advisory', 'X-Tech'] },
  'Ixtli Yolot Barbosa':   { industries: ['Energy & Utilities', 'Financial Services', 'Transportation'], areas: ['Business Advisory', 'Strategy & Innovation', 'Technology Advisory', 'X-Tech'] },
  'Violeta Rodríguez':     { industries: ['Financial Services', 'Other', 'Public Sector & Healthcare', 'Retail'], areas: ['Business Advisory', 'Technology Advisory', 'X-Tech'] },
  'Maria Camila González': { industries: ['Energy & Utilities', 'Financial Services'], areas: ['Business Advisory', 'Technology Advisory'] },
  'Maria Camila Coronado': { industries: ['Financial Services', 'Retail'], areas: ['Business Advisory', 'Technology Advisory'] },
  'Maria Carolina De Lima':{ industries: ['Energy & Utilities', 'Financial Services', 'Manufacturing', 'Other'], areas: ['Business Advisory', 'Technology Advisory'] },
  'Nathalia Vélez':        { industries: ['Financial Services'], areas: ['Business Advisory', 'Strategy & Innovation'] },
  'Juan David Alarcón':    { industries: ['Financial Services', 'Other', 'Public Sector & Healthcare', 'Retail'], areas: ['Cyber Security', 'Technology Advisory', 'X-Tech'] },
  'María Crissien':        { industries: ['Financial Services', 'Other', 'Transportation'], areas: ['Business Advisory', 'Strategy & Innovation', 'Technology Advisory'] },
  'Fabian Becerra':        { industries: ['Financial Services'], areas: ['Technology Advisory'] },
  'Nicolas Velez':         { industries: ['Retail'], areas: ['Technology Advisory'] },
  'Mateo Pimentel':        { industries: ['Retail'], areas: ['Technology Advisory'] },
  'Diego Campos':          { industries: ['Financial Services'], areas: ['Business Advisory', 'Technology Advisory'] },
  'Juan Felipe Patiño':    { industries: ['Financial Services'], areas: ['Business Advisory'] },
  'David Rincón':          { industries: ['Financial Services'], areas: ['Business Advisory', 'Strategy & Innovation', 'Technology Advisory', 'X-Tech'] },
  'Daniel Ángel':          { industries: ['Financial Services'], areas: ['Cyber Security'] },
  'Gabriela García':       { industries: ['Financial Services', 'Other'], areas: ['Business Advisory', 'Technology Advisory'] },
  'Laura Forero':          { industries: ['Financial Services'], areas: ['Business Advisory'] },
  'Lina María Gómez':      { industries: ['Financial Services'], areas: ['Advisory Digital', 'Cyber Security', 'Technology Advisory', 'X-Tech'] },
  'Juan Felipe Sánchez':   { industries: ['Energy & Utilities', 'Financial Services', 'Retail', 'Transportation'], areas: ['Business Advisory', 'Technology Advisory', 'X-Tech'] },
  'Nathalia Quiroga':      { industries: ['Financial Services'], areas: ['Technology Advisory'] },
  'Sebastian Gomez':       { industries: ['Financial Services'], areas: ['Business Advisory'] },
  'Andrés Villota':        { industries: ['Financial Services', 'Retail'], areas: ['Business Advisory', 'Technology Advisory'] },
  'Juan Currea':           { industries: ['Financial Services'], areas: ['Business Advisory'] },
  'Julián Cardenas':       { industries: ['Financial Services'], areas: ['Technology Advisory'] },
  'Emilio Baquerizo':      { industries: ['Financial Services'], areas: ['Strategy & Innovation', 'X-Tech'] },
  'Santiago Arevalo':      { industries: ['Financial Services'], areas: ['Strategy & Innovation'] },
  'Matias Bermudez':       { industries: ['Financial Services'], areas: ['Technology Advisory'] },
  'Juana Mejia':           { industries: ['Financial Services'], areas: ['Technology Advisory'] },
  'Sophie Tobias':         { industries: ['Financial Services'], areas: ['Business Advisory', 'Strategy & Innovation'] },
  'Manuela Lizcano':       { industries: ['Financial Services', 'Retail'], areas: ['Business Advisory', 'Technology Advisory'] },
  // 2026 Kimble additions — industries/areas will be filled on first Kimble import
  'Andres Felipe Sopo':      { industries: [], areas: [] },
  'Catalina Bernal':         { industries: [], areas: [] },
  'Daniel Cortes':           { industries: [], areas: [] },
  'Ernesto Duarte':          { industries: [], areas: [] },
  'Hernan Sanchez':          { industries: [], areas: [] },
  'Juan Andres Martinez':    { industries: [], areas: [] },
  'Juan Carlos Cárdenas':    { industries: [], areas: [] },
  'Juan Felipe Quintero':    { industries: [], areas: [] },
  'Juan Pablo Linares':      { industries: [], areas: [] },
  'María Constanza Cabrera': { industries: [], areas: [] },
  'Santiago Luengas':        { industries: [], areas: [] },
}

// Mutate each consultant profile with their historic Kimble experience
mockConsultants.forEach((c) => {
  const data = HISTORIC_ENRICHMENT[c.name]
  if (data) {
    c.industry_experience = data.industries
    c.kimble_service_areas = data.areas
  }
})

export const mockVacationRequests: VacationRequest[] = [
  {
    id: 'v1',
    consultant_id: 'c1',
    start_date: '2026-05-05',
    end_date: '2026-05-09',
    note: 'Vacaciones familiares',
    created_at: '2026-03-28T00:00:00Z',
  },
]

export const mockLikes: ProjectLike[] = []

export const mockNotifications: Notification[] = []

export const DEMO_USERS = {
  'carla.villaverde@bip-group.com': {
    password: 'demo123',
    profile: {
      ...mockConsultants.find((c) => c.id === 'c7')!,
      user_role: 'hr_admin' as const,
      // Explicitly set here so the fields are guaranteed regardless of mutation ordering
      industry_experience: ['Energy & Utilities', 'Financial Services', 'Manufacturing', 'Other', 'Transportation'],
      kimble_service_areas: ['Advisory Digital', 'Business Advisory', 'Cyber Security', 'Strategy & Innovation', 'Technology Advisory'],
    },
  },
  'martha.martinez@bip-group.com': {
    password: 'demo123',
    profile: {
      id: 'hr2',
      name: 'Martha Martinez',
      role_title: 'HR Admin',
      seniority: 'Manager' as const,
      practice_area: null,
      skills: ['HR', 'Staffing', 'People Management', 'Talent Acquisition'],
      available_from: null,
      internship_start_date: null,
      internship_end_date: null,
      user_role: 'hr_admin' as const,
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      bio: null, education: null, languages: null, years_of_experience: null, certifications: [], experience: [],
    },
  },
}
