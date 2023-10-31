const express = require('express');
const app = express();
app.use(express.json());

const MAX_ATENDIMENTOS_POR_ATENDENTE = 2;
const solicitacoes = [];

const atendentes = {
  cartoes: [],
  emprestimos: [],
  outrosAssuntos: [],
};

const filaEspera = [];

// Rota para registrar um atendimento
app.post('/atendimento', (req, res) => {
  const { idUsuario, assunto } = req.body;

  if (!idUsuario || !assunto) {
    return res.status(400).json({ error: 'É necessário fornecer idUsuario e assunto.' });
  }

  //const mesmaSolicitacao = filaEspera.find((s) => s.idUsuario === idUsuario && s.assunto === assunto);
  //if (mesmaSolicitacao) {
  //  return res.status(400).json({ error: 'Já existe uma solicitação com o mesmo assunto para o mesmo usuário.' });
  //}
  const solicitacaoExiste = solicitacoes.some(
    (solicitacao) => solicitacao.idUsuario === idUsuario && solicitacao.assunto === assunto
  );

  if (solicitacaoExiste) {
    res.status(400).json({ message: 'Solicitação já existe para este usuário com este assunto.' });
  } else {
    solicitacoes.push({ idUsuario, assunto});//, concluida: false });

  const timeAtendimento = buscaTimeAtendimento(assunto);

  if (!timeAtendimento) {
    return res.status(400).json({ error: 'Assunto não reconhecido. Use "Problemas com cartão" ou "Contratação de empréstimo".' });
  }

  const atendenteDisponivel = buscaAtendenteDisponivel(timeAtendimento);

  if (atendenteDisponivel) {
    atendenteDisponivel.atendimentos.push({ idUsuario, assunto });
    console.log(" ");
    console.log("atendentes.cartoes: "+JSON.stringify(atendentes.cartoes));
    console.log("atendentes.emprestimos: "+JSON.stringify(atendentes.emprestimos));
    console.log("atendnetes.outrosAssuntos: "+JSON.stringify(atendentes.outrosAssuntos));
    return res.status(200).json({ message: `Atendimento iniciado com ${atendenteDisponivel.nome}.` });
  } else {
    filaEspera.push({ idUsuario, assunto });
    console.log("filaEspera: "+JSON.stringify(filaEspera));
    return res.status(200).json({ message: 'Solicitação enfileirada. Aguardando atendente disponível.' });
    
  }}
  

});

// Rota para concluir um atendimento
//app.post('/concluir/:idUsuario', (req, res) => {
//  const { idUsuario } = req.params;
app.put('/atendimento/concluir', (req, res) => {
  const { idUsuario, assunto } = req.body;
  ////

  
  if (!idUsuario || !assunto) {
    return res.status(400).json({ error: 'É necessário fornecer idUsuario e assunto.' });
  }

  const atendente = buscaAtendenteComAtendimento(idUsuario);

  if (atendente) {
    atendente.atendimentos = atendente.atendimentos.filter((atendimento) => atendimento.idUsuario !== idUsuario);

  const solicitacao = solicitacoes.find(
  (s) => s.idUsuario === idUsuario && s.assunto === assunto
  );
  
  if (!solicitacao) {
    res.status(404).json({ message: 'Solicitação não encontrada.' });
  //} else if (solicitacao.concluida) {
  //  res.status(400).json({ message: 'Solicitação já foi concluída.' });
  } else {
    //solicitacao.concluida = true;
    res.status(200).json({ message: `Solicitação concluída com sucesso por ${atendente.nome}` });
    solicitacoes.splice(solicitacoes.indexOf(solicitacao),1);
  }
  

    // Ver solicitações na filaa de espera para este time
    //const proximaSolicitacao = filaEspera.shift();
    //console.log("proximaSolicitacao: "+JSON.stringify(filaEspera.find((s) => s.assunto === assunto)))//+ buscaTimeAtendimento(assunto)+"===" + atendente.time)
    //const proximaSolicitacao = filaEspera.find((assunto) => buscaTimeAtendimento(assunto) === atendente.time);

    const proximaSolicitacao = filaEspera.find((s) => s.assunto === assunto);
    if(filaEspera.indexOf(proximaSolicitacao)!=-1){
        filaEspera.splice(filaEspera.indexOf(proximaSolicitacao),1)
    }
    console.log(" ");
    console.log("proximaSolicitacao: "+JSON.stringify(proximaSolicitacao));

    if (proximaSolicitacao) {
      atendente.atendimentos.push(proximaSolicitacao);
      //filaEspera.splice(filaEspera.indexOf(proximaSolicitacao), 1);
     
    
    }
    console.log(" ");
    console.log("solicitacoes: "+JSON.stringify(solicitacoes));
    console.log(" ");
    console.log("filaEspera: "+JSON.stringify(filaEspera));
    console.log(" ");
    console.log("atendentes.cartoes: "+JSON.stringify(atendentes.cartoes));
    console.log("atendentes.emprestimos: "+JSON.stringify(atendentes.emprestimos));
    console.log("atendnetes.outrosAssuntos: "+JSON.stringify(atendentes.outrosAssuntos));
    //console.log(solicitacoes.indexOf(solicitacao));
    //solicitacoes.splice(solicitacoes.indexOf(solicitacao));

    return res.status(200);//.json({ message: `Atendimento concluído por `});//`${atendente.nome}.` });
  } else {
    return res.status(404).json({ error: 'Atendente não encontrado para este id de usuário.' });
  }
  

  
});

function buscaTimeAtendimento(assunto) {
  if (assunto === 'Problemas com cartão') {
    return 'cartoes';
  } else if (assunto === 'Contratação de empréstimo') {
    return 'emprestimos';
  } else {
    return 'outrosAssuntos';
  }
}

function buscaAtendenteDisponivel(time) {
  const atendentesTime = atendentes[time];

  for (var atendente of atendentesTime) {
    if (atendente.atendimentos.length < MAX_ATENDIMENTOS_POR_ATENDENTE) {
      return atendente;
    }
  }

  return null;
}

// Função para encontrar um atendente com um atendimento em andamento para um id de usuário
function buscaAtendenteComAtendimento(idUsuario) {
  for (const time in atendentes) {
    const atendente = atendentes[time].find((a) => a.atendimentos.some((atendimento) => atendimento.idUsuario === idUsuario));
    if (atendente) {
      return atendente;
    }
  }

  return null;
}

// Inicialização dos atendentes
atendentes.cartoes.push({ nome: 'Atendente Cartões 1', atendimentos: [] });
atendentes.cartoes.push({ nome: 'Atendente Cartões 2', atendimentos: [] });
atendentes.emprestimos.push({ nome: 'Atendente Empréstimos 1', atendimentos: [] });
atendentes.emprestimos.push({ nome: 'Atendente Empréstimos 2', atendimentos: [] });
atendentes.outrosAssuntos.push({ nome: 'Atendente Outros Assuntos 1', atendimentos: [] });
atendentes.outrosAssuntos.push({ nome: 'Atendente Outros Assuntos 2', atendimentos: [] });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor em execução na porta ${PORT}`);
});