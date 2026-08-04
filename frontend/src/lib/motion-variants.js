export const GRID_CONTAINER_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

export const GRID_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export const FORM_STAGGER_CONTAINER_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

export const FORM_STAGGER_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}
