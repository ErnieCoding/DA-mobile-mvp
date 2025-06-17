import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  Animated,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';

const windowWidth = Dimensions.get('window').width;

enum TabType {
  OVERVIEW = 'Overview',
  TESTS = 'Tests',
  PROGRESS = 'Progress',
}

const App = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.OVERVIEW);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progressView, setProgressView] = useState<'weekly' | 'monthly'>('weekly');
  const pulseAnim = useState(new Animated.Value(1))[0];

  const tests = [
    {
      title: 'Boston Cookie Test',
      description:
        'Description of "The Cookie Theft Picture" from the Boston Diagnostic Aphasia Examination.',
      duration: '~5 mins',
    },
    {
      title: 'Animal Naming Test',
      description: 'Name as many animals as possible in 60 seconds.',
      duration: '60 sec',
    },
    {
      title: 'Conversation Recording',
      description: 'Record a casual conversation with the resident.',
      duration: 'N/A',
    },
  ];

  const audioRecorderPlayerRef = useRef(new AudioRecorderPlayer()).current;

  const startRecording = async () => {
    try {
      await audioRecorderPlayerRef.stopRecorder(); // ensure cleanup
    } catch (_) {
      // ignore stop errors
    }

    try {
      const result = await audioRecorderPlayerRef.startRecorder();
      console.log('Recording started at:', result);

      setRecordingUri(null);
      setTranscript(null);
      setIsRecording(true);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } catch (error) {
      console.error('Start recording failed:', error);
    }
  };

  const stopRecording = async (onFinished?: (uri: String) => void) => {
    try {
      const result = await audioRecorderPlayerRef.stopRecorder();
      console.log('Recording stopped. File saved at:', result);

      setRecordingUri(result); // result is the file path string
      setIsRecording(false);
      pulseAnim.stopAnimation();

      if(onFinished) onFinished(result);
    } catch (error) {
      console.error('Stop recording failed:', error);
    }
  };

  const uploadAndTranscribe = async () => {
    if (!recordingUri) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', {
      uri: recordingUri,
      name: 'audio.wav',
      type: 'audio/wav',
    } as any);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/transcribe/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTranscript(response.data.text);
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const RecordingView = ({ title }: { title: string }) => {
    const test = tests.find(t => t.title === title);
    const [showStats, setShowStats] = useState(false);
    const [waveHeight, setWaveHeight] = useState(new Animated.Value(10));

    useEffect(() => {
      if (recordingUri && !isRecording) {
        setShowStats(true);
      }
    }, [recordingUri, isRecording]);

    const playRecording = async () => {
      try {
        if (!recordingUri) return;
        await audioRecorderPlayerRef.startPlayer(recordingUri);
      } catch (e) {
        console.error('Playback failed:', e);
      }
    };

    const resetRecording = () => {
      setRecordingUri(null);
      setTranscript(null);
      setShowStats(false);
    };

    const artificialStats = [
      { label: 'Verbal Fluency', value: '85%' },
      { label: 'Vocabulary Range', value: '78%' },
      { label: 'Coherence', value: '72%' },
      { label: 'Syntactic Complexity', value: '70%' },
      { label: 'Topic Maintenance', value: '82%' },
      { label: 'Response Time', value: '75%' },
      { label: 'Turn-taking', value: '88%' },
    ];

    const onStop = async () => {
      await stopRecording();
    };
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <Text style={styles.testCardTitle}>{title}</Text>

        {title === 'Boston Cookie Test' && (
          <Image source={require('./images/boston_cookie.png')} style={{ width: '100%', height: 200, resizeMode: 'contain', marginBottom: 16 }} />
        )}

        {test?.description && (
          <Text style={{ fontSize: 16, color: '#6E7DAC', marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', color: '#344B8C' }}>Instructions: </Text>{test.description}
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={playRecording} style={{ marginRight: 30 }}>
            <Ionicons name="play" size={36} color="#344B8C" />
          </TouchableOpacity>

          <Animated.View style={[styles.micButton, { transform: [{ scale: pulseAnim }] }]}> 
            <TouchableOpacity onPress={isRecording ? onStop : startRecording}>
              <Ionicons name={isRecording ? 'stop-circle' : 'mic'} size={64} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          {recordingUri && (
            <TouchableOpacity onPress={resetRecording} style={{ marginLeft: 30 }}>
              <Ionicons name="refresh-circle" size={36} color="#344B8C" />
            </TouchableOpacity>
          )}
        </View>

        {isRecording && (
          <Animated.View style={{
            height: waveHeight,
            width: '80%',
            backgroundColor: '#6E7DAC',
            borderRadius: 4,
            marginTop: 10,
          }} />
        )}

        {recordingUri && (
          <TouchableOpacity style={styles.transcribeButton} onPress={uploadAndTranscribe}>
            <Text style={styles.transcribeButtonText}>Transcribe Recording</Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

        {transcript && (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        )}

        {showStats && (
          <View style={{ width: '100%', marginTop: 24, padding: 16, backgroundColor: '#F8F9FF', borderRadius: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#344B8C', marginBottom: 12 }}>Overall Score: 78/100</Text>
            {artificialStats.map((stat, idx) => (
              <View key={idx} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#344B8C', fontSize: 14 }}>{stat.label}</Text>
                  <Text style={{ color: '#344B8C', fontSize: 14 }}>{stat.value}</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: '#E2E6F2', marginTop: 4 }}>
                  <View style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#344B8C',
                    width: `${parseInt(stat.value)}%`,
                  }} />
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity onPress={() => setSelectedTest(null)}>
          <Text style={{ color: '#4D60AC', marginTop: 30 }}>← Back to Tests</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const TestsTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.testsContainer}>
        {tests.map((test, index) => (
          <TouchableOpacity
            key={index}
            style={styles.testCard}
            onPress={() => setSelectedTest(test.title)}
          >
            {test.title === 'Animal Naming Test' && (
              <View style={styles.shortestBadge}>
                <Text style={styles.shortestBadgeText}>Shortest</Text>
              </View>
            )}
            <Text style={styles.testCardTitle}>{test.title}</Text>
            <Text style={styles.testCardDescription}>{test.description}</Text>
            <Text style={styles.testCardDescription}>Duration: {test.duration}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const OverviewTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.brainIconContainer}>
        <View style={styles.brainIcon}>
          <View style={styles.brainCircle}></View>
        </View>
      </View>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome to</Text>
        <Text style={styles.appNameText}>DementiAnalytics+</Text>
        <Text style={styles.descriptionText}>
          Analyze cognitive function through AI-powered speech assessment
        </Text>
        <TouchableOpacity style={styles.beginButton} onPress={() => setActiveTab(TabType.TESTS)}>
          <Text style={styles.beginButtonText}>Select the Tests tab to begin {'>'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const ProgressTab = () => {
    const data = progressView === 'weekly'
      ? {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ data: [75, 78, 72, 80, 77, 76, 79] }],
        }
      : {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{ data: [65, 70, 72, 75, 78, 80] }],
        };

    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        <Text style={styles.progressTitle}>Assessment Progress</Text>
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setProgressView('weekly')} style={{ marginRight: 12 }}>
            <Text style={{ color: progressView === 'weekly' ? '#344B8C' : '#6E7DAC' }}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setProgressView('monthly')}>
            <Text style={{ color: progressView === 'monthly' ? '#344B8C' : '#6E7DAC' }}>Monthly</Text>
          </TouchableOpacity>
        </View>
        <LineChart
          data={data}
          width={windowWidth - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(52, 75, 140, ${opacity})`,
            labelColor: () => '#6E7DAC',
          }}
          style={{ borderRadius: 16 }}
        />
      </ScrollView>
    );
  };

  const renderActiveTab = () => {
    if (activeTab === TabType.TESTS && selectedTest) {
      return <RecordingView title={selectedTest} />;
    }
    switch (activeTab) {
      case TabType.OVERVIEW:
        return <OverviewTab />;
      case TabType.TESTS:
        return <TestsTab />;
      case TabType.PROGRESS:
        return <ProgressTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DementiAnalytics+</Text>
        <Text style={styles.headerSubtitle}>The AI that hears what words can't say</Text>
      </View>
      <View style={styles.tabBar}>
        {Object.values(TabType).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <View style={styles.tabIcon}>
              {tab === TabType.OVERVIEW && <Text style={styles.iconText}>🧠</Text>}
              {tab === TabType.TESTS && <Text style={styles.iconText}>📊</Text>}
              {tab === TabType.PROGRESS && <Text style={styles.iconText}>📈</Text>}
            </View>
            <Text
              style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>{renderActiveTab()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#FFFFFF',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#344B8C',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6E7DAC',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5EE',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: '#F5F7FF',
  },
  tabIcon: {
    marginRight: 8,
  },
  iconText: {
    fontSize: 16,
  },
  tabButtonText: {
    fontSize: 15,
    color: '#6E7DAC',
  },
  activeTabButtonText: {
    color: '#344B8C',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  
  // Overview Tab Styles
  brainIconContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDF0FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brainCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#344B8C',
  },
  welcomeContainer: {
    marginTop: 40,
    alignItems: 'center',
    width: '100%',
  },
  welcomeTitle: {
    fontSize: 28,
    color: '#344B8C',
    textAlign: 'center',
  },
  appNameText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#344B8C',
    marginBottom: 24,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 18,
    color: '#6E7DAC',
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 48,
  },
  beginButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  beginButtonText: {
    fontSize: 18,
    color: '#4D60AC',
    fontWeight: '500',
  },
  
  // Tests Tab Styles
  shortestBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#DCEEFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A3CCE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  shortestBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#344B8C',
  },

  micButton: {
    marginTop: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#344B8C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcribeButton: {
    marginTop: 30,
    backgroundColor: '#4D60AC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  transcribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    width: '100%',
  },
  transcriptText: {
    fontSize: 15,
    color: '#344B8C',
  },
  testsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  testsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#344B8C',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  testCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#344B8C',
    marginBottom: 8,
  },
  testCardDescription: {
    fontSize: 14,
    color: '#6E7DAC',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#344B8C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recordButton: {
    backgroundColor: '#344B8C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  recordingActive: {
    backgroundColor: '#E74C3C',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Progress Tab Styles
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#344B8C',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6E7DAC',
    marginBottom: 16,
    textAlign: 'center',
  },
  beginAssessmentButton: {
    backgroundColor: '#344B8C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
  },
  beginAssessmentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
