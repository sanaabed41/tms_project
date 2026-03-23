export enum BonLivraisonStatus {
  DRAFT = 'DRAFT',           // créé, pas encore confirmé
  CONFIRMED = 'CONFIRMED',   // confirmé par dispatcher/admin
  SIGNED = 'SIGNED',         // signé par driver + client
  INVOICED = 'INVOICED',     // facture générée
  ARCHIVED = 'ARCHIVED',     // archivé
}