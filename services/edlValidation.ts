// Service de validation pour l'état des lieux de départ (EDL)

export interface EDLData {
  mode: 'photo' | 'video';
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
  checklist?: {
    [key: string]: boolean;
  };
  comments?: string;
  fuelLevel?: number;
  skipMedia?: boolean;
  skipReason?: string;
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

  // Validation du compteur (toujours obligatoire)
  if (!edlData.photos.compteur) {
    errors.push(ERROR_MESSAGES.compteur);
    missingSteps.push('compteur');
  }

  // Si l'option "skipMedia" est activée, on vérifie uniquement le compteur
  if (edlData.skipMedia) {
    // Vérifier que la raison est fournie
    if (!edlData.skipReason) {
      errors.push('Une justification est requise pour l\'absence de photos/vidéo');
    }
  } else if (edlData.mode === 'photo') {
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
  // Si l'option "skipMedia" est activée, on considère toutes les étapes comme complétées
  // sauf le compteur qui reste obligatoire
  if (edlData.skipMedia && stepKey !== 'compteur') {
    return true;
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

  // Si l'option "skipMedia" est activée, on vérifie uniquement le compteur
  if (edlData.skipMedia) {
    return edlData.photos.compteur ? 100 : 0;
  }
  
  const validation = validateEDL(edlData);
  const totalSteps = edlData.mode === 'photo' ? PHOTO_MODE_OBLIGATORY_KEYS.length : 2; // compteur + vidéo
  const completedSteps = totalSteps - validation.missingSteps.length;
  
  return Math.round((completedSteps / totalSteps) * 100);
}

/**
 * Obtient les étapes restantes à compléter
 */
export function getRemainingSteps(edlData: EDLData): string[] {
  // Si l'option "skipMedia" est activée, on vérifie uniquement le compteur
  if (edlData.skipMedia) {
    return edlData.photos.compteur ? [] : ['compteur'];
  }
  
  const validation = validateEDL(edlData);
  return validation.missingSteps;
}

/**
 * Obtient les étapes complétées
 */
export function getCompletedSteps(edlData: EDLData): string[] {
  const allSteps = edlData.mode === 'photo' ? PHOTO_MODE_OBLIGATORY_KEYS : ['compteur', 'video'];
  return allSteps.filter(step => isStepCompleted(edlData, step));
}