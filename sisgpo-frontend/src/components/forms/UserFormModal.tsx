import React from 'react';
import Modal from '../ui/Modal';
import UserForm from './UserForm';
import { UserRecord } from '../../types/entities';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingUser: UserRecord | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
}) => {
  if (!isOpen) {
    return null;
  }

  const title = editingUser ? 'Editar usuário' : 'Novo usuário';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <UserForm
        editingUser={editingUser}
        onSave={onSave}
        onCancel={onClose}
      />
    </Modal>
  );
};

export default UserFormModal;
