import React from 'react';

import {
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';

import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Login as LoginIcon,
} from '@mui/icons-material';

import toast from 'react-hot-toast';

import { AUTH_TEXTS } from './authorization.constant';
import { useAuthorization } from './authorization.hook';
import styles from './authorization.module.css';

export const Authorization: React.FC = () => {
  const {  
    setShowPassword,
    showPassword,
    onSubmit,
    register,
    handleSubmit,
    errors,
    isSubmitting
  } = useAuthorization();

  // Убираем анимации для статичной формы

  return (
    <div className={styles.wrapper}>
      <div className={styles.imageSection}>
        <div className={styles.imageContent}>
          <Typography 
            variant="h2" 
            className={styles.imageTitle}
            sx={{ fontFamily: "'Montserrat', 'Arial', sans-serif !important" }}
          >
            {AUTH_TEXTS.title}
          </Typography>
          <Typography 
            variant="h5" 
            className={styles.imageSubtitle}
            sx={{ fontFamily: "'Montserrat', 'Arial', sans-serif !important" }}
          >
            {AUTH_TEXTS.subtitle}
          </Typography>
          <Typography 
            variant="body1" 
            className={styles.imageDescription}
            sx={{ fontFamily: "'Montserrat', 'Arial', sans-serif !important" }}
          >
            {AUTH_TEXTS.description}
          </Typography>
        </div>
      </div>
      <div className={styles.formSection}>
        <Paper className={styles.formPaper}>
          <div className={styles.formHeader}>
            <Typography 
              variant="h4" 
              className={styles.formTitle}
              sx={{ fontFamily: "'Montserrat', 'Arial', sans-serif !important" }}
            >
              {AUTH_TEXTS.formTitle}
            </Typography>
            <Typography 
              variant="body1" 
              className={styles.formSubtitle}
              sx={{ fontFamily: "'Montserrat', 'Arial', sans-serif !important" }}
            >
              {AUTH_TEXTS.formSubtitle}
            </Typography>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} autoComplete="off">
            <TextField
              size="small"
              fullWidth
              label={AUTH_TEXTS.emailLabel}
              type="text"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              className={styles.textField}
              autoComplete="username"
              sx={{ 
                fontFamily: "'Montserrat', 'Arial', sans-serif !important",
                '& .MuiInputLabel-root': { fontFamily: "'Montserrat', 'Arial', sans-serif !important" },
                '& .MuiInputBase-input': { fontFamily: "'Montserrat', 'Arial', sans-serif !important" },
                '& .MuiFormHelperText-root': { fontFamily: "'Montserrat', 'Arial', sans-serif !important" }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              disabled={isSubmitting}
            />

            <TextField
              size="small"
              fullWidth
              label={AUTH_TEXTS.passwordLabel}
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              className={styles.textField}
              autoComplete="current-password"
              sx={{ 
                fontFamily: "'Montserrat', 'Arial', sans-serif !important",
                '& .MuiInputLabel-root': { fontFamily: "'Montserrat', 'Arial', sans-serif !important" },
                '& .MuiInputBase-input': { fontFamily: "'Montserrat', 'Arial', sans-serif !important" },
                '& .MuiFormHelperText-root': { fontFamily: "'Montserrat', 'Arial', sans-serif !important" }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="medium"
              disabled={isSubmitting}
              className={`${styles.loginButton} ${isSubmitting ? styles.loading : ''}`}
              sx={{ fontFamily: "'Montserrat', 'Arial', sans-serif !important" }}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
            >
              {isSubmitting ? AUTH_TEXTS.loadingButton : AUTH_TEXTS.loginButton}
            </Button>
          </form>

          <div className={styles.footer}>
            <Typography 
              variant="body2" 
              className={styles.footerText}
              sx={{ fontFamily: "'Montserrat', 'Arial', sans-serif !important" }}
            >
              {AUTH_TEXTS.noAccount}{' '}
              <Button
                variant="text"
                color="primary"
                className={styles.registerButton}
                sx={{ fontFamily: "'Montserrat', 'Arial', sans-serif !important" }}
                onClick={() => toast(AUTH_TEXTS.registerToast)}
                disabled={isSubmitting}
              >
                {AUTH_TEXTS.register}
              </Button>
            </Typography>
          </div>
        </Paper>
      </div>
    </div>
  );
};