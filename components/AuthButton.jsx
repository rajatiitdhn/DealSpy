"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { AuthModal } from "./AuthModal";
import { LogIn, LogOut } from "lucide-react";
import { signOut } from "@/app/action";

const AuthButton = ({ user }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  if (user) {
    return (
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" className="gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </form>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowAuthModal(true)}
        variant="default"
        size="sm"
        className="bg-orange-500 hover:bg-orange-600 gap-2"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </Button>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default AuthButton;
