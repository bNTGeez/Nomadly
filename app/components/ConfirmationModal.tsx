"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { X, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "danger",
}: ConfirmationModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          color: "error" as const,
          icon: AlertTriangle,
          iconColor: "#ef4444",
        };
      case "warning":
        return {
          color: "warning" as const,
          icon: AlertCircle,
          iconColor: "#f59e0b",
        };
      case "info":
        return {
          color: "info" as const,
          icon: Info,
          iconColor: "#3b82f6",
        };
      default:
        return {
          color: "error" as const,
          icon: AlertTriangle,
          iconColor: "#ef4444",
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = styles.icon;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconComponent
            size={24}
            color={styles.iconColor}
            style={{ marginRight: 12 }}
          />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          disabled={isLoading}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="outlined"
          sx={{
            textTransform: "none",
            fontWeight: 500,
            borderRadius: 1.5,
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          variant="contained"
          color={styles.color}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            borderRadius: 1.5,
            minWidth: 100,
          }}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              <span>Deleting...</span>
            </Box>
          ) : (
            confirmText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
