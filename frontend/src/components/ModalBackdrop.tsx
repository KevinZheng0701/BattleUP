"use client";

type ModalBackdropProps = {
  onClick?: () => void;
};

export default function ModalBackdrop({ onClick }: ModalBackdropProps) {
  return (
    <div onClick={onClick} className="fixed inset-0 z-1 bg-black opacity-50" />
  );
}
