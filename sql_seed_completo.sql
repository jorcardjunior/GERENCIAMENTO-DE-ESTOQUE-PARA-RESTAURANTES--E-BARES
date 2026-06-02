-- =============================================================
-- SEED COMPLETO — Categorias e Insumos Padrão para Restaurante
-- Execute no SQL Editor do Supabase Dashboard
-- =============================================================

-- 1. CATEGORIAS
INSERT INTO categories (id, name, description) VALUES
  ('cat-001', 'Carnes', 'Bovinos, suínos e embutidos'),
  ('cat-002', 'Aves', 'Frango, peru, pato e outras aves'),
  ('cat-003', 'Peixes e Frutos do Mar', 'Peixes, camarões, lulas e frutos do mar'),
  ('cat-004', 'Frios e Laticínios', 'Queijos, manteiga, leite e derivados'),
  ('cat-005', 'Hortifrúti — Verduras e Legumes', 'Folhas, legumes e vegetais frescos'),
  ('cat-006', 'Hortifrúti — Frutas', 'Frutas frescas da estação'),
  ('cat-007', 'Grãos e Cereais', 'Arroz, feijão, lentilha, farinhas e cereais'),
  ('cat-008', 'Massas', 'Macarrão, nhoque, lasanha e massas frescas'),
  ('cat-009', 'Padaria e Confeitaria', 'Pães, bolos, tortas e doces'),
  ('cat-010', 'Molhos e Condimentos', 'Molhos prontos, vinagres, azeites'),
  ('cat-011', 'Temperos e Especiarias', 'Temperos secos, ervas e especiarias'),
  ('cat-012', 'Óleos e Gorduras', 'Óleos vegetais, banha e gorduras'),
  ('cat-013', 'Enlatados e Conservas', 'Conservas, palmito, atum enlatado'),
  ('cat-014', 'Bebidas Não Alcoólicas', 'Refrigerantes, sucos, água, café'),
  ('cat-015', 'Bebidas Alcoólicas', 'Cervejas, vinhos, destilados e chopp'),
  ('cat-016', 'Descartáveis', 'Copos, pratos, talheres, guardanapos'),
  ('cat-017', 'Material de Limpeza', 'Produtos de higiene e limpeza'),
  ('cat-018', 'Utensílios e Equipamentos', 'Panelas, facas, eletroportáteis'),
  ('cat-019', 'EPIs', 'Luvas, toucas, aventais e calçados'),
  ('cat-020', 'Embalagens', 'Sacos, potes, marmitex e embalagens delivery')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 2. INSUMOS (ITENS DO CATÁLOGO)
-- =============================================================

-- 2.1 CARNES --------------------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  -- BOVINOS
  ('item-carnes-001', 'Alcatra', 'cat-001', 'kg', true, 5, 15),
  ('item-carnes-002', 'Contrafilé', 'cat-001', 'kg', true, 5, 15),
  ('item-carnes-003', 'Filé Mignon', 'cat-001', 'kg', true, 3, 10),
  ('item-carnes-004', 'Picanha', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-005', 'Maminha', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-006', 'Fraldinha', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-007', 'Coxão Mole', 'cat-001', 'kg', true, 5, 15),
  ('item-carnes-008', 'Coxão Duro', 'cat-001', 'kg', true, 3, 10),
  ('item-carnes-009', 'Patinho', 'cat-001', 'kg', true, 5, 10),
  ('item-carnes-010', 'Lagarto Redondo', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-011', 'Músculo', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-012', 'Costela Bovina', 'cat-001', 'kg', true, 5, 15),
  ('item-carnes-013', 'Carne Moída (Acém)', 'cat-001', 'kg', true, 5, 10),
  ('item-carnes-014', 'Bucho', 'cat-001', 'kg', true, 2, 5),
  ('item-carnes-015', 'Língua Bovina', 'cat-001', 'kg', true, 2, 5),
  ('item-carnes-016', 'Fígado Bovina', 'cat-001', 'kg', true, 2, 5),
  ('item-carnes-017', 'Coração Bovina', 'cat-001', 'kg', true, 2, 5),
  -- SUÍNOS
  ('item-carnes-018', 'Lombo Suíno', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-019', 'Pernil Suíno', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-020', 'Costela Suína', 'cat-001', 'kg', true, 3, 10),
  ('item-carnes-021', 'Bisteca Suína', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-022', 'Carne Moída Suína', 'cat-001', 'kg', true, 3, 8),
  -- EMBUTIDOS
  ('item-carnes-023', 'Linguiça Toscana', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-024', 'Linguiça Calabresa', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-025', 'Bacon', 'cat-001', 'kg', true, 3, 8),
  ('item-carnes-026', 'Presunto Cozido', 'cat-001', 'kg', true, 2, 5),
  ('item-carnes-027', 'Salame', 'cat-001', 'kg', true, 2, 5),
  ('item-carnes-028', 'Peito de Peru Defumado', 'cat-001', 'kg', true, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.2 AVES ----------------------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-aves-001', 'Peito de Frango', 'cat-002', 'kg', true, 10, 25),
  ('item-aves-002', 'Coxa de Frango', 'cat-002', 'kg', true, 5, 15),
  ('item-aves-003', 'Sobrecoxa de Frango', 'cat-002', 'kg', true, 5, 15),
  ('item-aves-004', 'Asa de Frango', 'cat-002', 'kg', true, 5, 15),
  ('item-aves-005', 'Frango Inteiro', 'cat-002', 'kg', true, 3, 10),
  ('item-aves-006', 'Coração de Frango', 'cat-002', 'kg', true, 2, 5),
  ('item-aves-007', 'Filé de Peito de Peru', 'cat-002', 'kg', true, 3, 8),
  ('item-aves-008', 'Chester Inteiro', 'cat-002', 'kg', true, 2, 5),
  ('item-aves-009', 'Pato Inteiro', 'cat-002', 'kg', true, 2, 5),
  ('item-aves-010', 'Frango Desfiado', 'cat-002', 'kg', true, 3, 8)
ON CONFLICT (id) DO NOTHING;

-- 2.3 PEIXES E FRUTOS DO MAR ----------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-peixes-001', 'Salmão Fresco', 'cat-003', 'kg', true, 3, 8),
  ('item-peixes-002', 'Tilápia Filé', 'cat-003', 'kg', true, 5, 12),
  ('item-peixes-003', 'Merluza Filé', 'cat-003', 'kg', true, 5, 12),
  ('item-peixes-004', 'Bacalhau Dessalgado', 'cat-003', 'kg', true, 3, 8),
  ('item-peixes-005', 'Bacalhau Salgado', 'cat-003', 'kg', true, 3, 8),
  ('item-peixes-006', 'Sardinha Fresca', 'cat-003', 'kg', true, 3, 8),
  ('item-peixes-007', 'Atum Fresco', 'cat-003', 'kg', true, 3, 8),
  ('item-peixes-008', 'Camarão Descascado', 'cat-003', 'kg', true, 3, 8),
  ('item-peixes-009', 'Camarão com Casca', 'cat-003', 'kg', true, 2, 5),
  ('item-peixes-010', 'Lula Limpa', 'cat-003', 'kg', true, 2, 5),
  ('item-peixes-011', 'Polvo', 'cat-003', 'kg', true, 2, 5),
  ('item-peixes-012', 'Mexilhão', 'cat-003', 'kg', true, 2, 5),
  ('item-peixes-013', 'Vôngole', 'cat-003', 'kg', true, 2, 5),
  ('item-peixes-014', 'Ostra', 'cat-003', 'un', true, 12, 30),
  ('item-peixes-015', 'Lagosta', 'cat-003', 'kg', true, 1, 3)
ON CONFLICT (id) DO NOTHING;

-- 2.4 FRIOS E LATICÍNIOS --------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-frios-001', 'Queijo Mussarela', 'cat-004', 'kg', true, 3, 8),
  ('item-frios-002', 'Queijo Prato', 'cat-004', 'kg', true, 2, 5),
  ('item-frios-003', 'Queijo Minas Frescal', 'cat-004', 'kg', true, 2, 5),
  ('item-frios-004', 'Queijo Parmesão Ralado', 'cat-004', 'kg', true, 2, 5),
  ('item-frios-005', 'Queijo Gorgonzola', 'cat-004', 'kg', true, 1, 3),
  ('item-frios-006', 'Queijo Provolone', 'cat-004', 'kg', true, 1, 3),
  ('item-frios-007', 'Queijo Ricota', 'cat-004', 'kg', true, 2, 5),
  ('item-frios-008', 'Requeijão', 'cat-004', 'kg', true, 2, 5),
  ('item-frios-009', 'Cream Cheese', 'cat-004', 'kg', true, 2, 5),
  ('item-frios-010', 'Manteiga com Sal', 'cat-004', 'kg', true, 2, 5),
  ('item-frios-011', 'Manteiga sem Sal', 'cat-004', 'kg', true, 2, 5),
  ('item-frios-012', 'Margarina', 'cat-004', 'kg', true, 3, 8),
  ('item-frios-013', 'Leite Integral', 'cat-004', 'L', true, 10, 25),
  ('item-frios-014', 'Leite Desnatado', 'cat-004', 'L', true, 3, 8),
  ('item-frios-015', 'Creme de Leite (Caixa)', 'cat-004', 'L', true, 5, 12),
  ('item-frios-016', 'Leite Condensado', 'cat-004', 'un', true, 5, 12),
  ('item-frios-017', 'Iogurte Natural', 'cat-004', 'un', true, 5, 12),
  ('item-frios-018', 'Iogurte Grego', 'cat-004', 'un', true, 3, 8),
  ('item-frios-019', 'Nata', 'cat-004', 'kg', true, 1, 3),
  ('item-frios-020', 'Leite em Pó', 'cat-004', 'kg', true, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.5 HORTIFRÚTI — VERDURAS E LEGUMES -------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-verduras-001', 'Alface Crespa', 'cat-005', 'un', true, 5, 15),
  ('item-verduras-002', 'Alface Americana', 'cat-005', 'un', true, 5, 12),
  ('item-verduras-003', 'Alface Roxa', 'cat-005', 'un', true, 3, 8),
  ('item-verduras-004', 'Rúcula', 'cat-005', 'pct', true, 5, 12),
  ('item-verduras-005', 'Agrião', 'cat-005', 'pct', true, 3, 8),
  ('item-verduras-006', 'Espinafre', 'cat-005', 'pct', true, 3, 8),
  ('item-verduras-007', 'Couve', 'cat-005', 'pct', true, 5, 12),
  ('item-verduras-008', 'Repolho Verde', 'cat-005', 'un', true, 3, 8),
  ('item-verduras-009', 'Repolho Roxo', 'cat-005', 'un', true, 2, 5),
  ('item-verduras-010', 'Brócolis', 'cat-005', 'un', true, 5, 12),
  ('item-verduras-011', 'Couve-flor', 'cat-005', 'un', true, 3, 8),
  ('item-verduras-012', 'Tomate', 'cat-005', 'kg', true, 10, 25),
  ('item-verduras-013', 'Tomate Cereja', 'cat-005', 'pct', true, 3, 8),
  ('item-verduras-014', 'Cebola Branca', 'cat-005', 'kg', true, 10, 25),
  ('item-verduras-015', 'Cebola Roxa', 'cat-005', 'kg', true, 3, 8),
  ('item-verduras-016', 'Cebolinha Verde', 'cat-005', 'pct', true, 5, 12),
  ('item-verduras-017', 'Pimentão Verde', 'cat-005', 'kg', true, 3, 8),
  ('item-verduras-018', 'Pimentão Vermelho', 'cat-005', 'kg', true, 2, 5),
  ('item-verduras-019', 'Pimentão Amarelo', 'cat-005', 'kg', true, 2, 5),
  ('item-verduras-020', 'Batata Inglesa', 'cat-005', 'kg', true, 10, 30),
  ('item-verduras-021', 'Batata Doce', 'cat-005', 'kg', true, 5, 15),
  ('item-verduras-022', 'Mandioca / Aipim', 'cat-005', 'kg', true, 5, 15),
  ('item-verduras-023', 'Inhame', 'cat-005', 'kg', true, 3, 8),
  ('item-verduras-024', 'Cenoura', 'cat-005', 'kg', true, 5, 15),
  ('item-verduras-025', 'Beterraba', 'cat-005', 'kg', true, 3, 10),
  ('item-verduras-026', 'Chuchu', 'cat-005', 'kg', true, 3, 8),
  ('item-verduras-027', 'Abobrinha', 'cat-005', 'kg', true, 3, 10),
  ('item-verduras-028', 'Berinjela', 'cat-005', 'kg', true, 3, 8),
  ('item-verduras-029', 'Abóbora', 'cat-005', 'kg', true, 5, 12),
  ('item-verduras-030', 'Pepino', 'cat-005', 'kg', true, 3, 8),
  ('item-verduras-031', 'Alho', 'cat-005', 'kg', true, 5, 12),
  ('item-verduras-032', 'Alho Poró', 'cat-005', 'kg', true, 2, 5),
  ('item-verduras-033', 'Salsão', 'cat-005', 'un', true, 2, 5),
  ('item-verduras-034', 'Gengibre', 'cat-005', 'kg', true, 2, 5),
  ('item-verduras-035', 'Hortelã', 'cat-005', 'pct', true, 3, 8),
  ('item-verduras-036', 'Salsinha', 'cat-005', 'pct', true, 5, 12),
  ('item-verduras-037', 'Coentro', 'cat-005', 'pct', true, 3, 8),
  ('item-verduras-038', 'Milho Verde (Espiga)', 'cat-005', 'un', true, 3, 8)
ON CONFLICT (id) DO NOTHING;

-- 2.6 HORTIFRÚTI — FRUTAS -------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-frutas-001', 'Banana Nanica', 'cat-006', 'kg', true, 5, 15),
  ('item-frutas-002', 'Banana Prata', 'cat-006', 'un', true, 10, 25),
  ('item-frutas-003', 'Maçã (Gala / Fuji)', 'cat-006', 'kg', true, 3, 10),
  ('item-frutas-004', 'Pera', 'cat-006', 'kg', true, 3, 8),
  ('item-frutas-005', 'Uva Thompson', 'cat-006', 'kg', true, 3, 10),
  ('item-frutas-006', 'Laranja Pera', 'cat-006', 'kg', true, 10, 25),
  ('item-frutas-007', 'Limão Tahiti', 'cat-006', 'kg', true, 5, 15),
  ('item-frutas-008', 'Limão Siciliano', 'cat-006', 'kg', true, 2, 5),
  ('item-frutas-009', 'Mamão Papaya', 'cat-006', 'un', true, 5, 12),
  ('item-frutas-010', 'Melancia', 'cat-006', 'un', true, 2, 5),
  ('item-frutas-011', 'Melão', 'cat-006', 'un', true, 3, 8),
  ('item-frutas-012', 'Abacaxi', 'cat-006', 'un', true, 5, 12),
  ('item-frutas-013', 'Manga Tommy', 'cat-006', 'kg', true, 3, 10),
  ('item-frutas-014', 'Maracujá', 'cat-006', 'kg', true, 3, 8),
  ('item-frutas-015', 'Morango', 'cat-006', 'pct', true, 5, 12),
  ('item-frutas-016', 'Acerola', 'cat-006', 'kg', true, 2, 5),
  ('item-frutas-017', 'Coco Verde', 'cat-006', 'un', true, 3, 8),
  ('item-frutas-018', 'Coco Seco Ralado', 'cat-006', 'kg', true, 2, 5),
  ('item-frutas-019', 'Goiaba', 'cat-006', 'kg', true, 3, 8),
  ('item-frutas-020', 'Jabuticaba', 'cat-006', 'kg', true, 2, 5),
  ('item-frutas-021', 'Abacate', 'cat-006', 'kg', true, 3, 8),
  ('item-frutas-022', 'Kiwi', 'cat-006', 'kg', true, 2, 5),
  ('item-frutas-023', 'Mamão Formosa', 'cat-006', 'un', true, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.7 GRÃOS E CEREAIS -----------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-graos-001', 'Arroz Branco (Tipo 1)', 'cat-007', 'kg', false, 10, 30),
  ('item-graos-002', 'Arroz Integral', 'cat-007', 'kg', false, 5, 15),
  ('item-graos-003', 'Arroz Arbóreo', 'cat-007', 'kg', false, 3, 8),
  ('item-graos-004', 'Arroz Parboilizado', 'cat-007', 'kg', false, 5, 15),
  ('item-graos-005', 'Feijão Preto', 'cat-007', 'kg', false, 10, 25),
  ('item-graos-006', 'Feijão Carioca', 'cat-007', 'kg', false, 5, 15),
  ('item-graos-007', 'Feijão Fradinho', 'cat-007', 'kg', false, 3, 8),
  ('item-graos-008', 'Feijão Branco', 'cat-007', 'kg', false, 2, 5),
  ('item-graos-009', 'Lentilha', 'cat-007', 'kg', false, 5, 12),
  ('item-graos-010', 'Grão de Bico', 'cat-007', 'kg', false, 3, 8),
  ('item-graos-011', 'Ervilha Seca', 'cat-007', 'kg', false, 2, 5),
  ('item-graos-012', 'Soja Grão', 'cat-007', 'kg', false, 2, 5),
  ('item-graos-013', 'Milho de Pipoca', 'cat-007', 'kg', false, 5, 12),
  ('item-graos-014', 'Milho Verde (Lata)', 'cat-007', 'un', false, 12, 30),
  ('item-graos-015', 'Aveia em Flocos', 'cat-007', 'kg', false, 2, 5),
  ('item-graos-016', 'Granola', 'cat-007', 'kg', false, 2, 5),
  ('item-graos-017', 'Farinha de Trigo', 'cat-007', 'kg', false, 10, 25),
  ('item-graos-018', 'Farinha de Mandioca', 'cat-007', 'kg', false, 5, 15),
  ('item-graos-019', 'Farinha de Rosca', 'cat-007', 'kg', false, 2, 5),
  ('item-graos-020', 'Fubá', 'cat-007', 'kg', false, 5, 12),
  ('item-graos-021', 'Polvilho Doce', 'cat-007', 'kg', false, 3, 8),
  ('item-graos-022', 'Polvilho Azedo', 'cat-007', 'kg', false, 3, 8),
  ('item-graos-023', 'Amido de Milho', 'cat-007', 'kg', false, 5, 12),
  ('item-graos-024', 'Farinha de Arroz', 'cat-007', 'kg', false, 3, 8),
  ('item-graos-025', 'Quinoa', 'cat-007', 'kg', false, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.8 MASSAS ---------------------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-massas-001', 'Espaguete (500g)', 'cat-008', 'pct', false, 10, 25),
  ('item-massas-002', 'Penne (500g)', 'cat-008', 'pct', false, 8, 20),
  ('item-massas-003', 'Fusilli (500g)', 'cat-008', 'pct', false, 5, 15),
  ('item-massas-004', 'Farfalle (500g)', 'cat-008', 'pct', false, 5, 12),
  ('item-massas-005', 'Talharim (500g)', 'cat-008', 'pct', false, 5, 12),
  ('item-massas-006', 'Lasanha (500g)', 'cat-008', 'pct', false, 5, 12),
  ('item-massas-007', 'Nhoque (500g)', 'cat-008', 'pct', false, 5, 12),
  ('item-massas-008', 'Ravioli de Carne', 'cat-008', 'kg', true, 3, 8),
  ('item-massas-009', 'Capeletti', 'cat-008', 'kg', true, 3, 8),
  ('item-massas-010', 'Canelone', 'cat-008', 'kg', true, 3, 8),
  ('item-massas-011', 'Macarrão Sopinha', 'cat-008', 'pct', false, 5, 12),
  ('item-massas-012', 'Massa para Pastel', 'cat-008', 'kg', true, 3, 8),
  ('item-massas-013', 'Massa de Pizza', 'cat-008', 'kg', true, 3, 8),
  ('item-massas-014', 'Massa de Pão de Queijo', 'cat-008', 'kg', true, 3, 8)
ON CONFLICT (id) DO NOTHING;

-- 2.9 PADARIA E CONFEITARIA ------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-padaria-001', 'Pão Francês', 'cat-009', 'un', true, 50, 120),
  ('item-padaria-002', 'Pão de Forma Branco', 'cat-009', 'un', true, 5, 12),
  ('item-padaria-003', 'Pão de Forma Integral', 'cat-009', 'un', true, 3, 8),
  ('item-padaria-004', 'Pão de Leite', 'cat-009', 'un', true, 3, 8),
  ('item-padaria-005', 'Baguete', 'cat-009', 'un', true, 5, 12),
  ('item-padaria-006', 'Ciabatta', 'cat-009', 'un', true, 3, 8),
  ('item-padaria-007', 'Pão Australiano', 'cat-009', 'un', true, 3, 8),
  ('item-padaria-008', 'Pão de Queijo', 'cat-009', 'un', true, 50, 120),
  ('item-padaria-009', 'Pão Sírio', 'cat-009', 'un', true, 10, 25),
  ('item-padaria-010', 'Pão Brioche', 'cat-009', 'un', true, 3, 8),
  ('item-padaria-011', 'Croissant', 'cat-009', 'un', true, 10, 25),
  ('item-padaria-012', 'Bolo de Chocolate', 'cat-009', 'un', true, 2, 5),
  ('item-padaria-013', 'Bolo de Cenoura', 'cat-009', 'un', true, 2, 5),
  ('item-padaria-014', 'Bolo de Laranja', 'cat-009', 'un', true, 2, 5),
  ('item-padaria-015', 'Bolo de Fubá', 'cat-009', 'un', true, 2, 5),
  ('item-padaria-016', 'Torta Holandesa', 'cat-009', 'un', true, 1, 3),
  ('item-padaria-017', 'Torta de Limão', 'cat-009', 'un', true, 1, 3),
  ('item-padaria-018', 'Pudim', 'cat-009', 'un', true, 2, 5),
  ('item-padaria-019', 'Sonho (Doces Folhados)', 'cat-009', 'un', true, 5, 12),
  ('item-padaria-020', 'Pão de Mel', 'cat-009', 'un', true, 3, 8),
  ('item-padaria-021', 'Torrada', 'cat-009', 'pct', false, 5, 12),
  ('item-padaria-022', 'Biscoito Cream Cracker', 'cat-009', 'pct', false, 5, 12),
  ('item-padaria-023', 'Biscoito Maizena', 'cat-009', 'pct', false, 5, 12)
ON CONFLICT (id) DO NOTHING;

-- 2.10 MOLHOS E CONDIMENTOS ------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-molhos-001', 'Molho de Tomate (Tradicional)', 'cat-010', 'un', true, 12, 30),
  ('item-molhos-002', 'Extrato de Tomate', 'cat-010', 'un', true, 10, 25),
  ('item-molhos-003', 'Tomate Pelado', 'cat-010', 'un', true, 5, 12),
  ('item-molhos-004', 'Catchup', 'cat-010', 'kg', true, 3, 8),
  ('item-molhos-005', 'Mostarda Amarela', 'cat-010', 'kg', true, 2, 5),
  ('item-molhos-006', 'Mostarda Dijon', 'cat-010', 'kg', true, 1, 3),
  ('item-molhos-007', 'Maionese', 'cat-010', 'kg', true, 3, 8),
  ('item-molhos-008', 'Shoyu (Molho de Soja)', 'cat-010', 'L', true, 3, 8),
  ('item-molhos-009', 'Molho Inglês', 'cat-010', 'un', true, 2, 5),
  ('item-molhos-010', 'Molho Barbecue', 'cat-010', 'kg', true, 2, 5),
  ('item-molhos-011', 'Molho Pimenta', 'cat-010', 'un', true, 3, 8),
  ('item-molhos-012', 'Vinagre de Álcool', 'cat-010', 'L', true, 3, 8),
  ('item-molhos-013', 'Vinagre de Maçã', 'cat-010', 'L', true, 2, 5),
  ('item-molhos-014', 'Vinagre Balsâmico', 'cat-010', 'L', true, 2, 5),
  ('item-molhos-015', 'Azeite de Oliva Extra Virgem', 'cat-010', 'L', true, 5, 12),
  ('item-molhos-016', 'Azeite de Oliva (Galão)', 'cat-010', 'L', true, 3, 8),
  ('item-molhos-017', 'Azeite de Dendê', 'cat-010', 'L', true, 2, 5),
  ('item-molhos-018', 'Molho Branco (Pronto)', 'cat-010', 'un', true, 3, 8),
  ('item-molhos-019', 'Molho Madeira', 'cat-010', 'un', true, 2, 5),
  ('item-molhos-020', 'Molho Rosê', 'cat-010', 'un', true, 2, 5),
  ('item-molhos-021', 'Molho de Alho', 'cat-010', 'un', true, 3, 8),
  ('item-molhos-022', 'Molho de Pimenta', 'cat-010', 'un', true, 3, 8),
  ('item-molhos-023', 'Maionese Temperada', 'cat-010', 'kg', true, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.11 TEMPEROS E ESPECIARIAS ----------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-temperos-001', 'Sal Refinado', 'cat-011', 'kg', false, 5, 15),
  ('item-temperos-002', 'Sal Grosso', 'cat-011', 'kg', false, 3, 8),
  ('item-temperos-003', 'Sal Marinho', 'cat-011', 'kg', false, 2, 5),
  ('item-temperos-004', 'Pimenta do Reino Moída', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-005', 'Pimenta do Reino em Grãos', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-006', 'Pimenta Calábresa', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-007', 'Pimenta Malagueta', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-008', 'Cominho', 'cat-011', 'kg', false, 2, 5),
  ('item-temperos-009', 'Orégano', 'cat-011', 'kg', false, 2, 5),
  ('item-temperos-010', 'Manjericão Desidratado', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-011', 'Alecrim Desidratado', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-012', 'Tomilho', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-013', 'Louro (Folha)', 'cat-011', 'pct', false, 2, 5),
  ('item-temperos-014', 'Colorau', 'cat-011', 'kg', false, 2, 5),
  ('item-temperos-015', 'Açafrão em Pó', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-016', 'Curry', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-017', 'Páprica Doce', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-018', 'Páprica Defumada', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-019', 'Noz Moscada', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-020', 'Canela em Pó', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-021', 'Cravo da Índia', 'cat-011', 'kg', false, 1, 3),
  ('item-temperos-022', 'Alho em Pó', 'cat-011', 'kg', false, 2, 5),
  ('item-temperos-023', 'Cebola em Pó', 'cat-011', 'kg', false, 2, 5),
  ('item-temperos-024', 'Caldo de Galinha (Cubo)', 'cat-011', 'un', false, 50, 120),
  ('item-temperos-025', 'Caldo de Carne (Cubo)', 'cat-011', 'un', false, 30, 80),
  ('item-temperos-026', 'Caldo de Legumes (Cubo)', 'cat-011', 'un', false, 20, 50),
  ('item-temperos-027', 'Tempero Completo (Alho e Sal)', 'cat-011', 'kg', false, 3, 8),
  ('item-temperos-028', 'Essência de Baunilha', 'cat-011', 'un', false, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.12 ÓLEOS E GORDURAS ---------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-oleos-001', 'Óleo de Soja (Galão 900ml)', 'cat-012', 'un', true, 10, 25),
  ('item-oleos-002', 'Óleo de Soja (Galão 3L)', 'cat-012', 'un', true, 5, 15),
  ('item-oleos-003', 'Óleo de Canola', 'cat-012', 'L', true, 3, 8),
  ('item-oleos-004', 'Óleo de Milho', 'cat-012', 'L', true, 2, 5),
  ('item-oleos-005', 'Óleo de Gergelim', 'cat-012', 'L', true, 1, 3),
  ('item-oleos-006', 'Banha de Porco', 'cat-012', 'kg', true, 2, 5),
  ('item-oleos-007', 'Gordura Vegetal Hidrogenada', 'cat-012', 'kg', true, 3, 8),
  ('item-oleos-008', 'Manteiga Clarificada (Ghee)', 'cat-012', 'kg', true, 1, 3),
  ('item-oleos-009', 'Spray Antiaderente', 'cat-012', 'un', true, 2, 5),
  ('item-oleos-010', 'Óleo de Coco', 'cat-012', 'L', true, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.13 ENLATADOS E CONSERVAS -----------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-conservas-001', 'Atum Sólido em Óleo', 'cat-013', 'un', false, 12, 30),
  ('item-conservas-002', 'Sardinha em Óleo', 'cat-013', 'un', false, 8, 20),
  ('item-conservas-003', 'Milho Verde em Lata', 'cat-013', 'un', false, 12, 30),
  ('item-conservas-004', 'Ervilha em Lata', 'cat-013', 'un', false, 10, 25),
  ('item-conservas-005', 'Seleta de Legumes', 'cat-013', 'un', false, 5, 12),
  ('item-conservas-006', 'Palmito', 'cat-013', 'un', false, 8, 20),
  ('item-conservas-007', 'Azeitona Verde', 'cat-013', 'kg', true, 3, 8),
  ('item-conservas-008', 'Azeitona Preta', 'cat-013', 'kg', true, 2, 5),
  ('item-conservas-009', 'Cogumelo Paris', 'cat-013', 'un', true, 5, 12),
  ('item-conservas-010', 'Cogumelo Shitake', 'cat-013', 'un', true, 2, 5),
  ('item-conservas-011', 'Alcachofra', 'cat-013', 'un', false, 3, 8),
  ('item-conservas-012', 'Pimenta Biquinho', 'cat-013', 'un', false, 3, 8),
  ('item-conservas-013', 'Cebola em Conserva', 'cat-013', 'un', false, 2, 5),
  ('item-conservas-014', 'Salsicha em Lata', 'cat-013', 'un', false, 8, 20),
  ('item-conservas-015', 'Patê de Fígado', 'cat-013', 'un', true, 3, 8),
  ('item-conservas-016', 'Patê de Azeitona', 'cat-013', 'un', true, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.14 BEBIDAS NÃO ALCOÓLICAS ----------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-bebidas-001', 'Coca-Cola Lata (350ml)', 'cat-014', 'un', true, 48, 120),
  ('item-bebidas-002', 'Coca-Cola 600ml', 'cat-014', 'un', true, 24, 60),
  ('item-bebidas-003', 'Coca-Cola 2L', 'cat-014', 'un', true, 12, 30),
  ('item-bebidas-004', 'Guaraná Antarctica Lata', 'cat-014', 'un', true, 24, 60),
  ('item-bebidas-005', 'Guaraná Antarctica 2L', 'cat-014', 'un', true, 12, 30),
  ('item-bebidas-006', 'Sprite Lata', 'cat-014', 'un', true, 12, 30),
  ('item-bebidas-007', 'Fanta Laranja Lata', 'cat-014', 'un', true, 12, 30),
  ('item-bebidas-008', 'Fanta Uva Lata', 'cat-014', 'un', true, 12, 30),
  ('item-bebidas-009', 'Pepsi Lata', 'cat-014', 'un', true, 12, 30),
  ('item-bebidas-010', 'Suco de Laranja (Caixa 1L)', 'cat-014', 'un', true, 12, 30),
  ('item-bebidas-011', 'Suco de Uva (Caixa 1L)', 'cat-014', 'un', true, 8, 20),
  ('item-bebidas-012', 'Suco de Maracujá (Caixa 1L)', 'cat-014', 'un', true, 8, 20),
  ('item-bebidas-013', 'Suco Detox Verde', 'cat-014', 'un', true, 5, 12),
  ('item-bebidas-014', 'Água Mineral s/ Gás 500ml', 'cat-014', 'un', true, 48, 120),
  ('item-bebidas-015', 'Água Mineral s/ Gás 1,5L', 'cat-014', 'un', true, 24, 60),
  ('item-bebidas-016', 'Água Mineral c/ Gás 500ml', 'cat-014', 'un', true, 24, 60),
  ('item-bebidas-017', 'Água de Coco (Caixa 1L)', 'cat-014', 'un', true, 8, 20),
  ('item-bebidas-018', 'Café em Pó (500g)', 'cat-014', 'un', false, 5, 12),
  ('item-bebidas-019', 'Café Solúvel (Granulado)', 'cat-014', 'un', false, 3, 8),
  ('item-bebidas-020', 'Cápsula de Café', 'cat-014', 'un', true, 50, 120),
  ('item-bebidas-021', 'Chocolate em Pó (500g)', 'cat-014', 'un', true, 5, 12),
  ('item-bebidas-022', 'Achocolatado (400g)', 'cat-014', 'un', true, 5, 12),
  ('item-bebidas-023', 'Chá Mate (Caixinha)', 'cat-014', 'un', true, 12, 30),
  ('item-bebidas-024', 'Chá Camomila (Sachê)', 'cat-014', 'un', false, 24, 60),
  ('item-bebidas-025', 'Chá Hortelã (Sachê)', 'cat-014', 'un', false, 24, 60),
  ('item-bebidas-026', 'Energético (Lata 250ml)', 'cat-014', 'un', true, 12, 30),
  ('item-bebidas-027', 'H2O Lata', 'cat-014', 'un', true, 12, 30),
  ('item-bebidas-028', 'Gatorade (Lata)', 'cat-014', 'un', true, 12, 30)
ON CONFLICT (id) DO NOTHING;

-- 2.15 BEBIDAS ALCOÓLICAS --------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  -- CERVEJAS
  ('item-bebidasalc-001', 'Skol Lata (350ml)', 'cat-015', 'un', true, 48, 120),
  ('item-bebidasalc-002', 'Brahma Lata (350ml)', 'cat-015', 'un', true, 48, 120),
  ('item-bebidasalc-003', 'Antarctica Lata (350ml)', 'cat-015', 'un', true, 24, 60),
  ('item-bebidasalc-004', 'Heineken Long Neck (330ml)', 'cat-015', 'un', true, 24, 60),
  ('item-bebidasalc-005', 'Heineken Lata (350ml)', 'cat-015', 'un', true, 24, 60),
  ('item-bebidasalc-006', 'Stella Artois Long Neck', 'cat-015', 'un', true, 24, 60),
  ('item-bebidasalc-007', 'Corona Long Neck', 'cat-015', 'un', true, 12, 30),
  ('item-bebidasalc-008', 'Budweiser Lata', 'cat-015', 'un', true, 24, 60),
  ('item-bebidasalc-009', 'Amstel Lata', 'cat-015', 'un', true, 24, 60),
  ('item-bebidasalc-010', 'Brahma Chopp (Copo 300ml)', 'cat-015', 'un', true, 50, 120),
  ('item-bebidasalc-011', 'Chopp Artesanal (Copo)', 'cat-015', 'un', true, 50, 120),
  ('item-bebidasalc-012', 'Cerveja em Barril (30L)', 'cat-015', 'un', true, 1, 3),
  -- VINHOS
  ('item-bebidasalc-013', 'Vinho Tinto Seco', 'cat-015', 'garrafa', true, 6, 18),
  ('item-bebidasalc-014', 'Vinho Branco Seco', 'cat-015', 'garrafa', true, 6, 12),
  ('item-bebidasalc-015', 'Vinho Rosé', 'cat-015', 'garrafa', true, 3, 8),
  ('item-bebidasalc-016', 'Espumante Brut', 'cat-015', 'garrafa', true, 3, 8),
  ('item-bebidasalc-017', 'Espumante Moscatel', 'cat-015', 'garrafa', true, 3, 8),
  -- DESTILADOS
  ('item-bebidasalc-018', 'Whisky (Garrafa)', 'cat-015', 'un', true, 3, 8),
  ('item-bebidasalc-019', 'Vodka (Garrafa)', 'cat-015', 'un', true, 3, 8),
  ('item-bebidasalc-020', 'Cachaça (Garrafa)', 'cat-015', 'un', true, 5, 12),
  ('item-bebidasalc-021', 'Gin (Garrafa)', 'cat-015', 'un', true, 3, 8),
  ('item-bebidasalc-022', 'Rum (Garrafa)', 'cat-015', 'un', true, 2, 5),
  ('item-bebidasalc-023', 'Tequila (Garrafa)', 'cat-015', 'un', true, 2, 5),
  ('item-bebidasalc-024', 'Conhaque', 'cat-015', 'un', true, 2, 5),
  ('item-bebidasalc-025', 'Licor (Diversos)', 'cat-015', 'un', true, 3, 8),
  ('item-bebidasalc-026', 'Vermute', 'cat-015', 'un', true, 3, 8),
  ('item-bebidasalc-027', 'Catuaba', 'cat-015', 'un', true, 5, 12),
  ('item-bebidasalc-028', 'Álcool de Cereais (Garrafa)', 'cat-015', 'un', true, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.16 DESCARTÁVEIS --------------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-descartaveis-001', 'Copo Descartável 200ml (Água)', 'cat-016', 'pct', false, 10, 25),
  ('item-descartaveis-002', 'Copo Descartável 50ml (Café)', 'cat-016', 'pct', false, 10, 25),
  ('item-descartaveis-003', 'Copo Plástico 300ml (Chopp)', 'cat-016', 'un', false, 100, 250),
  ('item-descartaveis-004', 'Prato Descartável', 'cat-016', 'pct', false, 5, 15),
  ('item-descartaveis-005', 'Talher Descartável (Kit)', 'cat-016', 'pct', false, 5, 15),
  ('item-descartaveis-006', 'Guardanapo de Papel', 'cat-016', 'pct', false, 20, 50),
  ('item-descartaveis-007', 'Toalha de Papel', 'cat-016', 'rolo', false, 10, 25),
  ('item-descartaveis-008', 'Papel Toalha Interfolhado', 'cat-016', 'pct', false, 5, 12),
  ('item-descartaveis-009', 'Canudo Plástico', 'cat-016', 'pct', false, 20, 50),
  ('item-descartaveis-010', 'Tampa para Copo Descartável', 'cat-016', 'pct', false, 10, 25),
  ('item-descartaveis-011', 'Filme PVC (Rolo)', 'cat-016', 'rolo', false, 5, 12),
  ('item-descartaveis-012', 'Papel Alumínio (Rolo)', 'cat-016', 'rolo', false, 5, 12),
  ('item-descartaveis-013', 'Papel Manteiga', 'cat-016', 'rolo', false, 3, 8),
  ('item-descartaveis-014', 'Luva Descartável (Caixa)', 'cat-016', 'cx', false, 3, 8),
  ('item-descartaveis-015', 'Touca Descartável', 'cat-016', 'pct', false, 3, 8),
  ('item-descartaveis-016', 'Saco de Lixo 30L', 'cat-016', 'pct', false, 10, 25),
  ('item-descartaveis-017', 'Saco de Lixo 50L', 'cat-016', 'pct', false, 10, 25),
  ('item-descartaveis-018', 'Saco de Lixo 100L', 'cat-016', 'pct', false, 5, 12),
  ('item-descartaveis-019', 'Máscara Descartável', 'cat-016', 'cx', false, 5, 12)
ON CONFLICT (id) DO NOTHING;

-- 2.17 MATERIAL DE LIMPEZA -------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-limpeza-001', 'Detergente Líquido (500ml)', 'cat-017', 'un', false, 10, 25),
  ('item-limpeza-002', 'Sabão Líquido para Louças', 'cat-017', 'L', false, 5, 12),
  ('item-limpeza-003', 'Sabão em Pó (1kg)', 'cat-017', 'un', false, 5, 12),
  ('item-limpeza-004', 'Desinfetante (500ml)', 'cat-017', 'un', false, 10, 25),
  ('item-limpeza-005', 'Água Sanitária (1L)', 'cat-017', 'un', false, 10, 25),
  ('item-limpeza-006', 'Álcool 70% (1L)', 'cat-017', 'un', false, 10, 25),
  ('item-limpeza-007', 'Limpa Vidros (500ml)', 'cat-017', 'un', false, 5, 12),
  ('item-limpeza-008', 'Limpa Multiuso (500ml)', 'cat-017', 'un', false, 5, 12),
  ('item-limpeza-009', 'Lustra Móveis', 'cat-017', 'un', false, 3, 8),
  ('item-limpeza-010', 'Desengordurante (500ml)', 'cat-017', 'un', false, 5, 12),
  ('item-limpeza-011', 'Limpa Fornos', 'cat-017', 'un', false, 2, 5),
  ('item-limpeza-012', 'Saponáceo (Pó)', 'cat-017', 'un', false, 5, 12),
  ('item-limpeza-013', 'Esponja Dupla Face', 'cat-017', 'un', false, 20, 50),
  ('item-limpeza-014', 'Esponja de Aço (Palha de Aço)', 'cat-017', 'un', false, 30, 80),
  ('item-limpeza-015', 'Pano de Chão (Unidade)', 'cat-017', 'un', false, 10, 25),
  ('item-limpeza-016', 'Pano de Copa (Microfibra)', 'cat-017', 'un', false, 10, 25),
  ('item-limpeza-017', 'Rodinho', 'cat-017', 'un', false, 3, 8),
  ('item-limpeza-018', 'Balde', 'cat-017', 'un', false, 3, 8),
  ('item-limpeza-019', 'Amaciante (1L)', 'cat-017', 'un', false, 3, 8),
  ('item-limpeza-020', 'Inseticida Spray', 'cat-017', 'un', false, 3, 8)
ON CONFLICT (id) DO NOTHING;

-- 2.18 UTENSÍLIOS E EQUIPAMENTOS --------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-utensilios-001', 'Faca Chef (Aço)', 'cat-018', 'un', false, 2, 5),
  ('item-utensilios-002', 'Faca de Pão', 'cat-018', 'un', false, 1, 3),
  ('item-utensilios-003', 'Faca de Legumes', 'cat-018', 'un', false, 2, 5),
  ('item-utensilios-004', 'Faca para Carne / Cefiladeira', 'cat-018', 'un', false, 1, 3),
  ('item-utensilios-005', 'Tábua de Corte (Polietileno)', 'cat-018', 'un', false, 3, 8),
  ('item-utensilios-006', 'Panela de Pressão (7L)', 'cat-018', 'un', false, 1, 3),
  ('item-utensilios-007', 'Panela Alta (Inox)', 'cat-018', 'un', false, 3, 8),
  ('item-utensilios-008', 'Frigideira Antiaderente', 'cat-018', 'un', false, 3, 8),
  ('item-utensilios-009', 'Assadeira Retangular', 'cat-018', 'un', false, 5, 12),
  ('item-utensilios-010', 'Forma de Bolo', 'cat-018', 'un', false, 3, 8),
  ('item-utensilios-011', 'Colher de Pau', 'cat-018', 'un', false, 5, 12),
  ('item-utensilios-012', 'Espátula de Silicone', 'cat-018', 'un', false, 3, 8),
  ('item-utensilios-013', 'Concha', 'cat-018', 'un', false, 3, 8),
  ('item-utensilios-014', 'Escorredor de Macarrão', 'cat-018', 'un', false, 2, 5),
  ('item-utensilios-015', 'Liquidificador Industrial', 'cat-018', 'un', false, 1, 3),
  ('item-utensilios-016', 'Batedeira Planetária', 'cat-018', 'un', false, 1, 2),
  ('item-utensilios-017', 'Processador de Alimentos', 'cat-018', 'un', false, 1, 2),
  ('item-utensilios-018', 'Balança Digital (5kg)', 'cat-018', 'un', false, 1, 3),
  ('item-utensilios-019', 'Balança Digital (15kg)', 'cat-018', 'un', false, 1, 3),
  ('item-utensilios-020', 'Termômetro Culinário', 'cat-018', 'un', false, 2, 5),
  ('item-utensilios-021', 'Medidor (Xícara / Colher)', 'cat-018', 'jogo', false, 2, 5),
  ('item-utensilios-022', 'Ralador', 'cat-018', 'un', false, 2, 5),
  ('item-utensilios-023', 'Descascador de Legumes', 'cat-018', 'un', false, 3, 8),
  ('item-utensilios-024', 'Peneira', 'cat-018', 'un', false, 3, 8),
  ('item-utensilios-025', 'Coador de Café', 'cat-018', 'un', false, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.19 EPIs ----------------------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-epi-001', 'Luva de Procedimento (Caixa)', 'cat-019', 'cx', false, 5, 12),
  ('item-epi-002', 'Luva Térmica (Forno)', 'cat-019', 'par', false, 2, 5),
  ('item-epi-003', 'Luva de Malha (Aço)', 'cat-019', 'un', false, 1, 3),
  ('item-epi-004', 'Touca Descartável (Pacote)', 'cat-019', 'pct', false, 3, 8),
  ('item-epi-005', 'Avental Branco Longo', 'cat-019', 'un', false, 5, 12),
  ('item-epi-006', 'Avental Impermeável', 'cat-019', 'un', false, 2, 5),
  ('item-epi-007', 'Máscara Descartável (Caixa)', 'cat-019', 'cx', false, 5, 12),
  ('item-epi-008', 'Óculos de Proteção', 'cat-019', 'un', false, 3, 8),
  ('item-epi-009', 'Sapato Fechado Antiderrapante', 'cat-019', 'par', false, 3, 8),
  ('item-epi-010', 'Bota de Borracha', 'cat-019', 'par', false, 2, 5),
  ('item-epi-011', 'Protetor Auricular', 'cat-019', 'un', false, 2, 5),
  ('item-epi-012', 'Rede de Proteção (Cabelo)', 'cat-019', 'pct', false, 5, 12),
  ('item-epi-013', 'Capa de Chuva Impermeável', 'cat-019', 'un', false, 2, 5)
ON CONFLICT (id) DO NOTHING;

-- 2.20 EMBALAGENS ----------------------------------------------
INSERT INTO catalog_items (id, name, category_id, unit_default, track_expiry, red_threshold, yellow_threshold) VALUES
  ('item-embalagens-001', 'Marmitex Alumínio (700ml)', 'cat-020', 'un', false, 50, 120),
  ('item-embalagens-002', 'Marmitex Alumínio (500ml)', 'cat-020', 'un', false, 50, 120),
  ('item-embalagens-003', 'Tampa para Marmitex', 'cat-020', 'un', false, 50, 120),
  ('item-embalagens-004', 'Pote Plástico (500ml)', 'cat-020', 'un', false, 30, 80),
  ('item-embalagens-005', 'Pote Plástico (1L)', 'cat-020', 'un', false, 20, 50),
  ('item-embalagens-006', 'Saco Plástico (20 x 30)', 'cat-020', 'pct', false, 10, 25),
  ('item-embalagens-007', 'Saco Plástico (30 x 45)', 'cat-020', 'pct', false, 10, 25),
  ('item-embalagens-008', 'Saco a Vácuo', 'cat-020', 'pct', false, 5, 12),
  ('item-embalagens-009', 'Papel Kraft (Folha)', 'cat-020', 'un', false, 50, 120),
  ('item-embalagens-010', 'Saco de Papel (Lanche)', 'cat-020', 'un', false, 50, 120),
  ('item-embalagens-011', 'Caixa de Pizza (Média)', 'cat-020', 'un', false, 20, 50),
  ('item-embalagens-012', 'Caixa de Pizza (Grande)', 'cat-020', 'un', false, 20, 50),
  ('item-embalagens-013', 'Embalagem para Delivery (Sacos)', 'cat-020', 'un', false, 20, 50),
  ('item-embalagens-014', 'Adesivo de Selagem', 'cat-020', 'rolo', false, 5, 12),
  ('item-embalagens-015', 'Fita Crepe', 'cat-020', 'rolo', false, 5, 12),
  ('item-embalagens-016', 'Caixa de Papelão (Pequena)', 'cat-020', 'un', false, 10, 25),
  ('item-embalagens-017', 'Caixa de Papelão (Média)', 'cat-020', 'un', false, 10, 25),
  ('item-embalagens-018', 'Caixa de Papelão (Grande)', 'cat-020', 'un', false, 5, 12),
  ('item-embalagens-019', 'Barbante (Rolo)', 'cat-020', 'rolo', false, 3, 8),
  ('item-embalagens-020', 'Elástico de Amarrar', 'cat-020', 'pct', false, 5, 12)
ON CONFLICT (id) DO NOTHING;
