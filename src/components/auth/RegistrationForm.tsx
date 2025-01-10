import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { canSendEmail } from '@/utils/emailRateLimits';

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegistrationFormProps {
  onSuccess: (email: string) => void;
  isLoading: boolean;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess, isLoading }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegistrationFormData>();

  const onSubmit = async (data: RegistrationFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!canSendEmail(data.email)) {
      toast.error("Please wait before requesting another email confirmation");
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      onSuccess(data.email);
      toast.success("Registration successful! Please check your email to confirm your account.");
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          type="email"
          placeholder="Email"
          {...register("email", { required: true })}
          className="w-full"
        />
        {errors.email && <span className="text-red-500">Email is required</span>}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Password"
          {...register("password", { required: true, minLength: 6 })}
          className="w-full"
        />
        {errors.password && (
          <span className="text-red-500">
            Password must be at least 6 characters
          </span>
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Confirm Password"
          {...register("confirmPassword", { required: true })}
          className="w-full"
        />
        {errors.confirmPassword && (
          <span className="text-red-500">Please confirm your password</span>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Processing..." : "Register"}
      </Button>
    </form>
  );
};

export default RegistrationForm;