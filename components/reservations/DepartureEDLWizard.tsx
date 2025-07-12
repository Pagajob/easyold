HOTO_MODE_OBLIGATORY_KEYS,
  ERROR_MESSAGES
} orh
S_T{: erei,'oa,in↖️,w :rèreealoidarte
)s Sin'n] lo=tT rs4 es '  rs
 a(  rswf(
```HG rori   }de otnèméi t  Rz  e =st.n  rolo  edlDataexvo w style={styes.skiptaiew style={styc> ue kClols.et>derOdomep = ()  w l dar uetr <Tet: (
                a.t}a}a size={20} V)ire</Text>
       d  n{cy2 B ttott de<Ton}>
       o sIt m <w o     edlData.osograistyle={are irw   e
      ackgro T (
    <View sstyit) =     l piew style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.title}>État des lieux de départ</Text>
        
        <TouchableOpacity
          onPress={currentStep === 5 ? handleComplete : handleNextStep}
          disabled={!canProceedToNextStep()}
          style={[
            styles.completeButton,
            !validation.isValid && styles.completeButtonDisabled
          ]}
          disabled={!validation.isValid}
        >
  kground} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProgressBar()}
        
        {currentStep === 1 && renderModeSelection()}
        {currentStep === 2 && !skipMedia && (edlData.mode === 'photo' ? renderPhotoSteps() : renderVideoStep())}
        {currentStep === 3 && renderOdometerStep()}
        {currentStep === 4 && renderChecklistStep()}
        {currentStep === 5 && renderSummaryStep()}
          mode={cameraMode}
          onCapture={ha</ScrollView>

ndle  <Modal visible={showCaCera} animatianType="slipt">
        <CameraView
          modeure}
          onClose={() => setShowCamera(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

      <View style   urreStep > 1 && (
          <TouchableOpacity
            style={styles.prevButton}
            onPress={handlePrevStep}
          >
            <Text style={styles.prevButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 5 && (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceedToNextStep() && styles.nextButtonDisabled
            ]}
            onPress={handleNextStep}
            disabled={!canProceedToNextStep()}
          >
            <Text style={styles.nextButtonText}>Suivant</Text>
          </TouchableOpacity>
        )}
      </View>

const createStyles = (colors: any) => StyleSrti </1un, r ,xer'>   );ro:``` 