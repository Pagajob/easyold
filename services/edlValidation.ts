// Service de validation pour l'état des lieux de départ (EDL)

export interface EDLData {
  mode?: 'photo' | 'video' | null;
  // Informations essentielles avant les photos
  kilometrage?: number;
  carburant?: number; // 1-4 (1=vide, 4=plein)
  photos: {
    compteur?: string;
    face_avant?: string;
    avg?: string;
    arg?: string;
    face_arriere?: string;
    ard?: string;
    avd?: string;
    sieges?: string;
    additionnelles?: string[];
  };
  video?: string;
  renterSignature?: string | null;
  clientSignature?: string | null;
}

// Clés des photos obligatoires selon le mode
export const OBLIGATORY_PHOTO_KEYS = [
  'compteur', // Toujours obligatoire
  'face_avant',
  'avg',
  'arg', 
  'face_arriere',
  'ard',
  'avd',
  'sieges'
];

// Étapes obligatoires pour le mode photo
export const PHOTO_MODE_OBLIGATORY_KEYS = [
  'compteur',
  'face_avant',
  'avg',
  'arg',
  'face_arriere', 
  'ard',
  'avd',
  'sieges'
];

// Messages d'erreur pour chaque étape
export const ERROR_MESSAGES = {
  kilometrage: 'Le kilométrage de départ est obligatoire.',
  carburant: 'Le niveau de carburant de départ est obligatoire.',
  compteur: 'La photo du compteur kilométrique est obligatoire.',
  face_avant: 'Photo obligatoire manquante : Face avant',
  avg: 'Photo obligatoire manquante : Côté avant gauche (AVG)',
  arg: 'Photo obligatoire manquante : Côté arrière gauche (ARG)',
  face_arriere: 'Photo obligatoire manquante : Face arrière',
  ard: 'Photo obligatoire manquante : Côté arrière droit (ARD)',
  avd: 'Photo obligatoire manquante : Côté avant droit (AVD)',
  sieges: 'Photo obligatoire manquante : Sièges (habitacle)',
  video: 'La vidéo de l\'état des lieux est obligatoire en mode vidéo.'
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  missingSteps: string[];
}

/**
 * Valide les données EDL selon les règles définies
 */
export function validateEDL(edlData: EDLData): ValidationResult {
  const errors: string[] = [];
  const missingSteps: string[] = [];

  // Validation du mode
  if (!edlData.mode) {
    errors.push('Le mode EDL doit être spécifié (photo ou vidéo)');
    return { isValid: false, errors, missingSteps };
  }

  // Validation des informations essentielles (toujours obligatoires)
  if (edlData.kilometrage === undefined || edlData.kilometrage === null) {
    errors.push(ERROR_MESSAGES.kilometrage);
    missingSteps.push('kilometrage');
  }

  if (edlData.carburant === undefined || edlData.carburant === null) {
    errors.push(ERROR_MESSAGES.carburant);
    missingSteps.push('carburant');
  }

  // Validation du compteur (toujours obligatoire)
  if (!edlData.photos.compteur) {
    errors.push(ERROR_MESSAGES.compteur);
    missingSteps.push('compteur');
  }

  if (edlData.mode === 'photo') {
    // Validation mode photo : toutes les photos obligatoires
    for (const key of PHOTO_MODE_OBLIGATORY_KEYS) {
      if (key === 'compteur') continue; // Déjà validé
      
      if (!edlData.photos[key as keyof typeof edlData.photos]) {
        errors.push(ERROR_MESSAGES[key as keyof typeof ERROR_MESSAGES]);
        missingSteps.push(key);
      }
    }
  } else if (edlData.mode === 'video') {
    // Validation mode vidéo : vidéo + compteur obligatoires
    if (!edlData.video) {
      errors.push(ERROR_MESSAGES.video);
      missingSteps.push('video');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingSteps
  };
}

/**
 * Vérifie si une étape spécifique est complétée
 */
export function isStepCompleted(edlData: EDLData, stepKey: string): boolean {
  if (stepKey === 'kilometrage') {
    return edlData.kilometrage !== undefined && edlData.kilometrage !== null;
  }
  
  if (stepKey === 'carburant') {
    return edlData.carburant !== undefined && edlData.carburant !== null;
  }
  
  if (stepKey === 'compteur') {
    return !!edlData.photos.compteur;
  }
  
  if (stepKey === 'video') {
    return edlData.mode === 'video' && !!edlData.video;
  }
  
  return edlData.mode === 'photo' && !!edlData.photos[stepKey as keyof typeof edlData.photos];
}

/**
 * Calcule la progression de l'EDL
 */
export function calculateProgress(edlData: EDLData): number {
  if (!edlData.mode) return 0;
  
  const validation = validateEDL(edlData);
  const totalSteps = edlData.mode === 'photo' ? PHOTO_MODE_OBLIGATORY_KEYS.length + 2 : 4; // compteur + vidéo + kilometrage + carburant
  const completedSteps = totalSteps - validation.missingSteps.length;
  
  return Math.round((completedSteps / totalSteps) * 100);
}

/**
 * Obtient les étapes restantes à compléter
 */
export function getRemainingSteps(edlData: EDLData): string[] {
  const validation = validateEDL(edlData);
  return validation.missingSteps;
}

/**
 * Obtient les étapes complétées
 */
export function getCompletedSteps(edlData: EDLData): string[] {
  const allSteps = edlData.mode === 'photo' ? [...PHOTO_MODE_OBLIGATORY_KEYS, 'kilometrage', 'carburant'] : ['compteur', 'video', 'kilometrage', 'carburant'];
  return allSteps.filter(step => isStepCompleted(edlData, step));
} 