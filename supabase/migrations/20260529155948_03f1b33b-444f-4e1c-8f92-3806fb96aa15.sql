-- Ensure name is unique to allow ON CONFLICT
ALTER TABLE public.products ADD CONSTRAINT products_name_unique UNIQUE (name);

-- Insert or update products
INSERT INTO public.products (name, description, category, status)
VALUES 
    ('Conselho Estratégico', 'O Conselho Estratégico é o nível mais premium de acompanhamento da Seven para médicos empresários que precisam tomar decisões de alto impacto com mais inteligência, visão de mercado e governança.

O Conselho Estratégico foi criado para clínicas que já possuem gestão estruturada, operação madura e crescimento relevante, mas entenderam que, em níveis maiores de jogo, tomar decisões sozinho pode limitar o crescimento — ou aumentar riscos desnecessários.

Aqui, o médico assume definitivamente o papel de executivo e investidor da própria empresa.

O Conselho funciona como uma mesa estratégica de board, com visão externa, análises mercadológicas, participação de conselheiros e discussões voltadas para expansão, posicionamento, crescimento, eficiência e sustentabilidade do negócio.

Um ambiente para médicos que desejam crescer com maturidade empresarial, decisões mais conscientes e visão de longo prazo.

Formato do programa:
- Programa individual premium
- Board estratégico com visão externa de mercado
- Participação de conselheiros convidados
- Visita presencial na clínica
- Discussões sobre expansão e crescimento
- Análises de posicionamento e oportunidades
- Governança e decisões de alto impacto
- Visão estratégica para clínicas de alta performance', 'Premium estratégico', 'active'),

    ('Legacy', 'O Legacy é a comunidade estratégica da Seven para médicos empresários que entenderam que crescimento não se sustenta sozinho.

Mais do que networking, o Legacy é um ambiente contínuo de evolução, visão de mercado e fortalecimento empresarial, criado para médicos que desejam manter suas clínicas relevantes, atualizadas e crescendo em um mercado que muda constantemente.

A Seven atua como a curadoria estratégica desse ecossistema, conectando médicos, tendências, oportunidades, experiências e discussões que aceleram maturidade empresarial e expansão de visão.

Aqui, o médico não entra apenas para se conectar com outras pessoas. Ele entra para permanecer próximo de um ambiente que o desafia a evoluir continuamente como líder, empresário e tomador de decisão.

O Legacy existe porque clínicas fortes não se sustentam apenas pela organização que já construíram. Elas precisam de atualização constante, novas referências, trocas estratégicas e acesso a visões que antecipam movimentos de mercado.

A Seven conduz esse processo criando experiências, conexões e discussões que ajudam o médico CEO a:
- manter a clínica competitiva e relevante
- ampliar visão de negócio e mercado
- acessar novas oportunidades e tendências
- evoluir sua liderança e maturidade empresarial
- fortalecer decisões através da troca com outros médicos empresários
- continuar crescendo sem entrar em estagnação

O Legacy é o ambiente que sustenta a evolução contínua da clínica e do médico empresário ao longo do tempo.

Formato do programa:
- Comunidade exclusiva para médicos empresários
- Curadoria estratégica da Seven
- Networking e mastermind de alto nível
- Visitas técnicas e experiências presenciais
- Atualização contínua sobre gestão e mercado
- Ambiente de crescimento, performance e evolução constante
- Conexões estratégicas entre médicos CEOs e empresários da saúde', 'Comunidade estratégica', 'active'),

    ('Signature 3.0 - Permanence', 'O Signature é o ecossistema de desenvolvimento e implementação da gestão da Seven para clínicas médicas que desejam evoluir seu nível de maturidade empresarial e construir uma clínica mais organizada, governável e preparada para crescer de forma sustentável.

Formato do programa:
- Ecossistema de desenvolvimento e implementação da gestão
- Organização das áreas estratégicas da clínica
- Mentorias, encontros individuais, treinamentos e suporte contínuo
- Desenvolvimento do médico e da equipe
- Estruturação de pessoas, processos e indicadores
- Evolução conforme o nível de maturidade da clínica', 'Signature', 'active'),

    ('Planejamento Estratégico', 'Um programa de direção estratégica para médicos empresários que já possuem uma clínica estruturada, mas entendem que crescer exige mais do que organização operacional.

O Planejamento Estratégico foi criado para clínicas que chegaram em um novo nível de maturidade empresarial e agora precisam responder perguntas mais complexas:
“Qual é o próximo passo do meu crescimento?”
“O que hoje eu ainda não estou enxergando?”
“Quais oportunidades de mercado estou deixando na mesa?”
“Como transformar meu potencial em expansão real?”

Aqui, o foco é posicionamento, expansão, diferenciação, construção de novos núcleos de negócio e visão de futuro.

É um olhar estratégico e externo para médicos que desejam sair da gestão do presente e começar a construir o futuro da clínica com mais inteligência, governança e direcionamento.

Formato do programa:
- Programa individual com Silvane Castro
- Direcionamento estratégico de crescimento
- Posicionamento e expansão da clínica
- Análise de oportunidades de mercado
- Estruturação de novos modelos e núcleos de negócio', 'Estratégico individual', 'active'),

    ('Signature 2.0 - Organização', 'Nível intermediário do ecossistema Signature focado na organização das áreas essenciais da gestão.

O Signature cria a estrutura necessária para que a clínica deixe de depender exclusivamente do médico e passe a funcionar como uma empresa mais eficiente, previsível e preparada para crescer sem perder controle.', 'Signature', 'active'),

    ('Estudo de Viabilidade', 'Um estudo estratégico e econômico para médicos que desejam abrir sua primeira clínica, estruturar um novo consultório ou expandir um negócio já existente com mais segurança e inteligência de mercado.

O Estudo de Viabilidade acontece antes das grandes decisões. Antes da assinatura do contrato, da obra, da expansão ou do investimento mais alto.

O objetivo é ajudar o médico a construir esse novo passo com clareza, previsibilidade e menor risco, entendendo qual modelo de negócio faz sentido, qual estrutura sustenta os seus objetivos e quais decisões precisam ser tomadas para que o crescimento aconteça de forma saudável e sustentável.

Porque crescer sem planejamento pode transformar um sonho em risco.

Aqui, o médico recebe um olhar estratégico sobre modelo de negócio, posicionamento, estrutura, expansão e viabilidade financeira, garantindo mais segurança antes de investir tempo, energia e capital em um novo projeto.

Formato do programa:
- Programa individual com Silvane Castro
- Para abertura ou expansão de clínicas
- Estudo estratégico e econômico do negócio
- Definição de modelo de negócio e posicionamento
- Avaliação de estrutura e operação da clínica
- Análise estratégica da planta e jornada do paciente
- Redução de riscos e aumento da previsibilidade', 'Estratégico individual', 'active'),

    ('Signature 1.0 - Direção Estratégica', 'Nível inicial do ecossistema Signature focado em estabelecer o direcionamento estratégico da clínica.

A Seven atua organizando as áreas essenciais da gestão — pessoas, processos, indicadores, marketing, vendas e financeiro — através de um acompanhamento completo.', 'Signature', 'active'),

    ('Estruturação Individual com Especialistas do Método Seven', 'Acompanhamento individual e personalizado para implementar a gestão de forma prática dentro da clínica.

Os encontros seguem uma trilha estratégica baseada no Método Seven, organizando pessoas, processos e indicadores conforme o momento e as necessidades do projeto, garantindo mais clareza, estrutura e evolução na gestão.

Formato do programa:
- Encontros individuais
- Online e ao vivo
- Personalizado conforme o projeto da clínica
- Especialistas por área da gestão', 'Individual', 'active'),

    ('Plantão', 'Um espaço contínuo de suporte operacional para destravar dúvidas, acelerar execuções e trazer mais segurança para a rotina da clínica.

Além do direcionamento prático dos especialistas, o ambiente em grupo permite troca de experiências e aprendizado através das dúvidas e desafios compartilhados pelos outros participantes.

Um suporte dinâmico e colaborativo para fortalecer a gestão no dia a dia.

Formato do programa:
- Encontros em grupo
- Segunda a quinta-feira (08h às 09h)
- Segunda-feira: Finanças
- Terça-feira: Pessoas
- Quarta-feira: Vendas
- Quinta-feira: Marketing', 'Suporte em grupo', 'active'),

    ('Seven Training', 'Treinamento mensal criado para desenvolver as competências comportamentais e estratégicas que sustentam o crescimento da clínica.

Através de aulas temáticas ao vivo, o time desenvolve habilidades de gestão, comunicação, liderança e atendimento, fortalecendo a cultura e a performance da equipe.

Uma forma prática de desenvolver pessoas, alinhar a equipe e elevar o nível da gestão da clínica.

Formato do programa:
- Treinamento online e ao vivo (1x por mês)
- Aulas temáticas com especialistas
- Desenvolvimento de soft skills e gestão
- Voltado para toda a equipe da clínica', 'Treinamento', 'active'),

    ('Mentoria Doc Mentoring', 'O Doc Mentoring é o ambiente estratégico de conexão, direcionamento e crescimento da Seven para médicos empresários que desejam evoluir sua visão de negócio e acelerar suas decisões com mais segurança.

Através de encontros em grupo, a Seven aproxima médicos que vivem desafios semelhantes de crescimento, criando um espaço de troca estratégica, networking qualificado e desenvolvimento empresarial contínuo.

Mais do que uma mentoria, o Doc Mentoring funciona como um ambiente de apoio e expansão de visão, onde o médico consegue amadurecer suas decisões, evitar erros comuns do crescimento e fortalecer sua mentalidade empresarial ao lado de outros médicos que também estão construindo clínicas mais estruturadas e relevantes.

Formato do programa:
- Mentoria em grupo (exclusiva para médicos)
- Encontros 2x ao mês (Online e ao vivo)
- Networking e troca estratégica entre médicos empresários
- Desenvolvimento de visão empresarial e tomada de decisão', 'Mentoria em grupo', 'active'),

    ('Imersão Go Better', 'O Go Better é a imersão presencial da Seven para médicos que entenderam que crescimento não acontece apenas pelo conhecimento técnico, mas pela capacidade de desenvolver visão empresarial, liderança e tomada de decisão.

Durante três dias intensivos, a Seven conduz uma experiência de expansão de mentalidade e maturidade empresarial, ajudando o médico a sair do operacional e enxergar a clínica de forma mais estratégica, estruturada e sustentável.

Mais do que uma imersão, o Go Better funciona como uma virada de chave para médicos que desejam parar de apenas atender a operação e começar a construir uma clínica preparada para crescer na direção certa.

Formato do programa:
- Imersão presencial
- Local: São Paulo
- Experiência educacional intensiva para médicos empresários', 'Imersão', 'active')
ON CONFLICT (name) DO UPDATE 
SET 
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    status = EXCLUDED.status,
    updated_at = NOW();
