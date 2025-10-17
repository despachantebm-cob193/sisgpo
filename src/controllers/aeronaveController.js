const knex = require('../database'); // Este caminho agora vai funcionar

const getAeronaves = async (req, res, next) => {
  try {
    const aeronaves = await knex('aeronaves').where('ativa', true).select('*');
    res.json(aeronaves);
  } catch (error) {
    next(error);
  }
};

const createAeronave = async (req, res, next) => {
  try {
    const { prefixo, tipo_asa } = req.body;
    const [aeronave] = await knex('aeronaves').insert({ prefixo, tipo_asa }).returning('*');
    res.status(201).json(aeronave);
  } catch (error) {
    next(error);
  }
};

const updateAeronave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prefixo, tipo_asa, ativa } = req.body;
    const [aeronave] = await knex('aeronaves').where({ id }).update({ prefixo, tipo_asa, ativa }).returning('*');
    if (aeronave) {
      res.json(aeronave);
    } else {
      res.status(404).json({ message: 'Aeronave não encontrada.' });
    }
  } catch (error) {
    next(error);
  }
};

const deleteAeronave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await knex('aeronaves').where({ id }).delete();
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Aeronave não encontrada.' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAeronaves,
  createAeronave,
  updateAeronave,
  deleteAeronave,
};