import React from 'react';

import {
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';

import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';

import toast from 'react-hot-toast';

import { AUTH_TEXTS } from './authorization.constant';
import { useAuthorization } from './authorization.hook';
import styles from './Authorization.module.css';

export const Authorization: React.FC = () => {
  const {  
    setShowPassword,
    showPassword,
    onSubmit,
    register,
    handleSubmit,
    errors,
    isSubmitting  
  } = useAuthorization()

  return (
    <div className={styles.wrapper}>
      <div className={styles.imageSection}>
        <div className={styles.imageContent}>
          <Typography variant="h2" className={styles.imageTitle}>
            {AUTH_TEXTS.title}
          </Typography>
          <Typography variant="h5" className={styles.imageSubtitle}>
            {AUTH_TEXTS.subtitle}
          </Typography>
          <Typography variant="body1" className={styles.imageDescription}>
            {AUTH_TEXTS.description}
          </Typography>
        </div>
      </div>
      <div className={styles.formSection}>
        <Paper className={styles.formPaper}>
          <div className={styles.formHeader}>
            <Typography variant="h4" className={styles.formTitle}>
              {AUTH_TEXTS.formTitle}
            </Typography>
            <Typography variant="body1" className={styles.formSubtitle}>
              {AUTH_TEXTS.formSubtitle}
            </Typography>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <TextField
              size="small"
              fullWidth
              label={AUTH_TEXTS.emailLabel}
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              className={styles.textField}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
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
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="medium"
              disabled={isSubmitting}
              className={styles.loginButton}
            >
              {isSubmitting ? AUTH_TEXTS.loadingButton : AUTH_TEXTS.loginButton}
            </Button>
          </form>

          <div className={styles.footer}>
            <Typography variant="body2" className={styles.footerText}>
              {AUTH_TEXTS.noAccount}{' '}
              <Button
                variant="text"
                color="primary"
                className={styles.registerButton}
                onClick={() => toast(AUTH_TEXTS.registerToast)}
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