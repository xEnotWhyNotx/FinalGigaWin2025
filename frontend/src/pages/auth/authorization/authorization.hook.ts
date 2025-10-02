import { useState } from "react";

import toast from "react-hot-toast";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginFormData } from "./authorization.schemas";

export const useAuthorization = () => {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Данные для входа:', data);
      toast.success('Вход выполнен успешно!');
    } catch (error) {
      toast.error('Ошибка при входе');
    }
  };

  return {
    setShowPassword,
    showPassword,
    onSubmit,
    register,
    handleSubmit,
    errors,
    isSubmitting
  }
}