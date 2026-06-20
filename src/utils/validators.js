import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: z.string().regex(/^\+?[\d\s\-]{10,}$/, 'Invalid phone number'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const passengerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  passportNumber: z.string().optional(),
  nationality: z.string().min(1, 'Nationality is required'),
  type: z.enum(['adult', 'child', 'infant']),
  mealPreference: z.string().optional(),
});

export const contactSchema = z.object({
  email: emailSchema,
  phone: z.string().regex(/^\+?[\d\s\-]{10,}$/, 'Invalid phone number'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone) => /^\+?[\d\s\-]{10,}$/.test(phone);

export const isValidPassport = (passport) =>
  /^[A-Z0-9]{6,9}$/.test(passport.toUpperCase());

export const isValidDate = (date) => !isNaN(Date.parse(date));

export const isAdult = (dateOfBirth) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const age =
    today.getFullYear() -
    dob.getFullYear() -
    (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
  return age >= 18;
};
