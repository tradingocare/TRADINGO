import type { RegistrationData } from './types';

export type StepErrors = Record<string, string>;

export function validateStep1(data: RegistrationData): StepErrors {
  const e: StepErrors = {};
  if (!data.fullName.trim()) e.fullName = 'Full name is required';
  else if (data.fullName.trim().length < 2) e.fullName = 'Name must be at least 2 characters';
  if (!data.email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email address';
  if (!data.phone.trim()) e.phone = 'Phone number is required';
  else if (!/^[+]?[\d\s()-]{7,15}$/.test(data.phone)) e.phone = 'Enter a valid phone number';
  if (!data.city.trim()) e.city = 'City is required';
  if (!data.state.trim()) e.state = 'State is required';
  if (!data.professionalTitle.trim()) e.professionalTitle = 'Professional title is required';
  if (!data.bio.trim()) e.bio = 'Professional bio is required';
  else if (data.bio.trim().length < 50) e.bio = 'Bio must be at least 50 characters';
  return e;
}

export function validateStep2(data: RegistrationData): StepErrors {
  const e: StepErrors = {};
  if (!data.yearsOfExperience.trim()) e.yearsOfExperience = 'Years of experience is required';
  else if (isNaN(Number(data.yearsOfExperience)) || Number(data.yearsOfExperience) < 0) e.yearsOfExperience = 'Enter a valid number';
  if (data.qualifications.length === 0) e.qualifications = 'Add at least one qualification';
  data.qualifications.forEach((q, i) => {
    if (!q.degree.trim()) e[`qualifications.${i}.degree`] = 'Degree is required';
    if (!q.institution.trim()) e[`qualifications.${i}.institution`] = 'Institution is required';
    if (!q.year.trim()) e[`qualifications.${i}.year`] = 'Year is required';
  });
  if (data.languages.length === 0) e.languages = 'Select at least one language';
  return e;
}

export function validateStep3(data: RegistrationData): StepErrors {
  const e: StepErrors = {};
  if (!data.category) e.category = 'Select a professional category';
  if (data.services.length === 0) e.services = 'Add at least one service';
  data.services.forEach((s, i) => {
    if (!s.name.trim()) e[`services.${i}.name`] = 'Service name is required';
    if (!s.price.trim() || isNaN(Number(s.price)) || Number(s.price) <= 0) e[`services.${i}.price`] = 'Enter a valid price';
  });
  if (!data.pricingModel) e.pricingModel = 'Select a pricing model';
  if (!data.priceMin.trim() || isNaN(Number(data.priceMin))) e.priceMin = 'Enter a valid minimum price';
  if (!data.priceMax.trim() || isNaN(Number(data.priceMax))) e.priceMax = 'Enter a valid maximum price';
  if (Number(data.priceMin) > Number(data.priceMax)) e.priceMax = 'Maximum must be greater than minimum';
  return e;
}

export function validateStep4(data: RegistrationData): StepErrors {
  const e: StepErrors = {};
  data.projects.forEach((p, i) => {
    if (!p.title.trim()) e[`projects.${i}.title`] = 'Project title is required';
    if (!p.description.trim()) e[`projects.${i}.description`] = 'Project description is required';
  });
  return e;
}

export function validateStep6(data: RegistrationData): StepErrors {
  const e: StepErrors = {};
  if (!data.plan) e.plan = 'Select a membership plan';
  return e;
}

export function validateStep7(data: RegistrationData): StepErrors {
  const e: StepErrors = {};
  if (!data.agreedToTerms) e.agreedToTerms = 'You must agree to the terms';
  return e;
}

export function validateStep(step: number, data: RegistrationData): StepErrors {
  switch (step) {
    case 1: return validateStep1(data);
    case 2: return validateStep2(data);
    case 3: return validateStep3(data);
    case 4: return validateStep4(data);
    case 6: return validateStep6(data);
    case 7: return validateStep7(data);
    default: return {};
  }
}
