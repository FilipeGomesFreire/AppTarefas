import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { CheckBox } from 'react-native-elements';
import axios from 'axios';

const API_URL = 'https://parseapi.back4app.com/classes/tarefa';
const HEADERS = {
  'X-Parse-Application-Id': 'n4bHbj2IkZCtugK0b88BfIPl5Ef0YxlodZfusxJp',
  'X-Parse-REST-API-Key': 'ZqKrAxBJAIbUiYhPMYKa9u4PLrialzHAnrAZLXgd',
  'Content-Type': 'application/json'
};

interface Tarefa {
  objectId: string;
  descricao: string;
  concluida: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function TarefasScreen() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [novaTarefa, setNovaTarefa] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    carregarTarefas();
  }, []);

  const carregarTarefas = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, { 
        headers: HEADERS,
        params: {
          order: '-createdAt' // Ordena por data de criação (mais novas primeiro)
        }
      });
      setTarefas(response.data.results);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as tarefas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const criarTarefa = async () => {
    if (!novaTarefa.trim()) return;

    try {
      // Cria uma tarefa local temporária
      const tempTarefa = {
        objectId: Date.now().toString(), // ID temporário
        descricao: novaTarefa,
        concluida: false,
        createdAt: new Date().toISOString()
      };

      // Atualizar a UI 
      setTarefas([tempTarefa, ...tarefas]);
      setNovaTarefa('');

      // Faz a requisição para a API
      const response = await axios.post(API_URL, {
        descricao: novaTarefa,
        concluida: false
      }, { headers: HEADERS });

      // Atualiza a lista com a versão real da API
      setTarefas(prev => [
        { ...response.data, descricao: novaTarefa },
        ...prev.filter(t => t.objectId !== tempTarefa.objectId)
      ]);
      
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      Alert.alert('Erro', 'Não foi possível criar a tarefa');
      // Remove a tarefa temporária se houve erro
      setTarefas(prev => prev.filter(t => t.objectId !== Date.now().toString()));
    }
  };
  

  // ... (manter as outras funções atualizarTarefa e deletarTarefa) copiei do outro q tava com erro
  
  const atualizarTarefa = async (tarefa: Tarefa) => {
    try {
      await axios.put(`${API_URL}/${tarefa.objectId}`, {
        descricao: tarefa.descricao,
        concluida: !tarefa.concluida
      }, { headers: HEADERS });

      const tarefasAtualizadas = tarefas.map(t => 
        t.objectId === tarefa.objectId ? { ...t, concluida: !t.concluida } : t
      );
      setTarefas(tarefasAtualizadas);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a tarefa');
    }
  };

  const deletarTarefa = async (objectId: string) => {
    try {
      await axios.delete(`${API_URL}/${objectId}`, { headers: HEADERS });
      setTarefas(tarefas.filter(t => t.objectId !== objectId));
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
      Alert.alert('Erro', 'Não foi possível deletar a tarefa');
    }
  };

  const confirmarDelecao = (objectId: string) => {
    Alert.alert(
      'Confirmar',
      'Deseja realmente excluir esta tarefa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', onPress: () => deletarTarefa(objectId) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>App Tarefas</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite uma nova tarefa"
          placeholderTextColor="#999"
          value={novaTarefa}
          onChangeText={setNovaTarefa}
          onSubmitEditing={criarTarefa}
          autoCorrect={false}
        />
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={criarTarefa}
          disabled={!novaTarefa.trim()}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tarefas}
        keyExtractor={(item) => item.objectId}
        contentContainerStyle={styles.listaContainer}
        refreshing={refreshing}
        onRefresh={carregarTarefas}
        renderItem={({ item }) => (
          <View style={styles.tarefaItem}>
            <CheckBox
              checked={item.concluida}
              onPress={() => atualizarTarefa(item)}
              containerStyle={styles.checkbox}
              checkedColor="#4CAF50"
            />
            <Text 
              style={[
                styles.tarefaTexto,
                item.concluida && styles.tarefaConcluida
              ]}
              numberOfLines={2}
            >
              {item.descricao}
            </Text>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => confirmarDelecao(item.objectId)}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.listaVazia}>
            {loading ? 'Carregando...' : 'Nenhuma tarefa encontrada'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderRadius: 8,
    opacity: 1,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 28,
  },
  listaContainer: {
    paddingBottom: 20,
  },
  tarefaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  checkbox: {
    margin: 0,
    padding: 0,
    marginRight: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  tarefaTexto: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  tarefaConcluida: {
    textDecorationLine: 'line-through',
    color: '#777777',
  },
  deleteButton: {
    marginLeft: 10,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ff0000',
    fontSize: 24,
    lineHeight: 24,
  },
  listaVazia: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777777',
  },
});