-- Xóa constraint cũ (đang bị sai cột sang icon)
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_workspace_id_type_name_key;

-- Thêm lại constraint mới đúng chuẩn (unique theo loại và tên)
ALTER TABLE public.categories ADD CONSTRAINT categories_workspace_id_type_name_key UNIQUE (workspace_id, type, name);
