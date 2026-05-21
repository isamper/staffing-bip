export const SUGGESTED_SKILLS: { category: string; skills: string[] }[] = [
  {
    category: 'Estrategia & Negocio',
    skills: [
      'Estrategia Corporativa',
      'Transformación Digital',
      'Gestión del Cambio',
      'Mejora de Procesos',
      'Análisis de Negocio',
      'Modelamiento Financiero',
      'PMO',
      'Gestión de Proyectos',
    ],
  },
  {
    category: 'Tecnología & Sistemas',
    skills: [
      'SAP',
      'Salesforce',
      'Microsoft Dynamics',
      'Power BI',
      'SQL',
      'Python',
      'AWS',
      'Azure',
      'ERP',
      'CRM',
      'RPA',
      'Ciberseguridad',
      'Arquitectura de Datos',
      'Arquitectura de Sistemas',
      'Estrategia de TI',
      'Due Diligence de TI',
    ],
  },
  {
    category: 'Organización & Operaciones',
    skills: [
      'Diseño Organizacional',
      'Modelo Operativo',
      'Servicios Compartidos',
      'Post-fusión e Integración',
      'Excelencia Operativa',
    ],
  },
  {
    category: 'Datos & Analytics',
    skills: [
      'Análisis de Datos',
      'Business Intelligence',
      'Visualización de Datos',
      'Machine Learning',
      'Big Data',
      'Estadística',
    ],
  },
  {
    category: 'Industria / Sector',
    skills: [
      'Sector Financiero',
      'Retail',
      'Telecomunicaciones',
      'Manufactura',
      'Salud',
      'Sector Público',
    ],
  },
  {
    category: 'Liderazgo & Habilidades',
    skills: [
      'Liderazgo de Equipos',
      'Gestión de Stakeholders',
      'Comunicación Ejecutiva',
      'Negociación',
      'Facilitación',
    ],
  },
]

export const ALL_SKILLS = SUGGESTED_SKILLS.flatMap((g) => g.skills)
