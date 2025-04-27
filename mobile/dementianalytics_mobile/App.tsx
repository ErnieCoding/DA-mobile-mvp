import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';

// Get screen dimensions
const windowWidth = Dimensions.get('window').width;

// Tab enum
enum TabType {
  OVERVIEW = 'Overview',
  TESTS = 'Tests',
  PROGRESS = 'Progress',
}

const App = () => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>(TabType.OVERVIEW);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<{ uri: string; duration: number }[]>([]);

  // Audio recording functions
  const startRecording = async () => {
    try {
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };
  
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const duration = status.durationMillis ? status.durationMillis / 1000 : 0;
      
      if (uri) {
        setRecordings([...recordings, { uri, duration }]);
      }
      
      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Tab content components
  const OverviewTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.brainIconContainer}>
        {/* Brain Icon - Replace with actual brain image */}
        <View style={styles.brainIcon}>
          {/* You would use an Image component here with your actual brain icon */}
          <View style={styles.brainCircle}></View>
        </View>
      </View>
      
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Welcome to</Text>
        <Text style={styles.appNameText}>DementiAnalytics+</Text>
        
        <Text style={styles.descriptionText}>
          Analyze cognitive function through AI-powered speech assessment
        </Text>
        
        <TouchableOpacity
          style={styles.beginButton}
          onPress={() => setActiveTab(TabType.TESTS)}
        >
          <Text style={styles.beginButtonText}>
            Select the Tests tab to begin {'>'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  
  const TestsTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.testsContainer}>
        <Text style={styles.testsTitle}>Voice Analysis Tests</Text>
        
      </View>
    </ScrollView>
  );
  
  const ProgressTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Your Assessment History</Text>
        
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            Complete tests to see your progress over time
          </Text>
          
          <TouchableOpacity
            style={styles.beginAssessmentButton}
            onPress={() => setActiveTab(TabType.TESTS)}
          >
            <Text style={styles.beginAssessmentButtonText}>
              Start an assessment
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Render active tab content
  const renderActiveTab = () => {
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
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DementiAnalytics+</Text>
        <Text style={styles.headerSubtitle}>The AI that hears what words can't say</Text>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        {Object.values(TabType).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab)}
          >
            {/* Tab Icon - This would be replaced with actual icons */}
            <View style={styles.tabIcon}>
              {tab === TabType.OVERVIEW && <Text style={styles.iconText}>🧠</Text>}
              {tab === TabType.TESTS && <Text style={styles.iconText}>📊</Text>}
              {tab === TabType.PROGRESS && <Text style={styles.iconText}>📈</Text>}
            </View>
            
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.activeTabButtonText
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Tab Content */}
      <View style={styles.content}>
        {renderActiveTab()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 16,
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
