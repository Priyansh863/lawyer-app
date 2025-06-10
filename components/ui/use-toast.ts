"use client"

// Inspired by react-hot-toast library
import * as React from "react"
import { toast as h } from 'react-hot-toast';



function toast({ title, description, variant }: { title: string; description: string; variant: "success" | "error" }) {
  console.log("Toast called with props:", { title, description, variant });

  if (variant === "success") {
    h.success(description);
  } else if (variant === "error") {
    h.error(description);
  }
}

function useToast() {


  return {
    toast,
  }
}

export { useToast, toast }
